// server.js - Proxy server for MCP.run QR code servlet
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');
const EventSource = require('eventsource');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from 'public' directory

// MCP.run signed URL
const MCP_SIGNED_URL = process.env.MCP_SIGNED_URL; // Your signed URL from mcp.run

// Endpoint to proxy requests to the QR code servlet
app.post('/api/qr-code', async (req, res) => {
  try {
    const { text, size = 250 } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text content is required' });
    }
    
    if (!MCP_SIGNED_URL) {
      return res.status(500).json({ 
        error: 'MCP signed URL is not configured',
        message: 'Please set the MCP_SIGNED_URL environment variable'
      });
    }

    console.log(`Generating QR code for text: ${text.substring(0, 30)}${text.length > 30 ? '...' : ''} with size ${size}`);
    
    // Create a connection to the MCP.run servlet using the signed URL
    // This is a more complex process using EventSource for Server-Sent Events
    // We'll need to establish a connection, send a request, and listen for events
    
    let result = null;
    let error = null;
    let completed = false;
    
    // Set a timeout to ensure we don't wait forever
    const timeout = setTimeout(() => {
      if (!completed) {
        error = 'Request timed out';
        completed = true;
        return res.status(504).json({
          error: 'Request timed out',
          message: 'The QR code generation request took too long to complete',
          success: false
        });
      }
    }, 30000); // 30 second timeout
    
    // Connect to the MCP server using the signed URL
    const mcp = new EventSource(`${MCP_SIGNED_URL}`);
    
    mcp.onopen = () => {
      console.log('Connected to MCP.run servlet');
      
      // Send a request to the 'generate' tool
      const requestId = Date.now().toString();
      const request = {
        id: requestId,
        method: 'tools/call',
        params: {
          name: 'generate',
          arguments: {
            text: text,
            size: size
          }
        }
      };
      
      mcp.dispatchEvent(new Event('open'));
      mcp.dispatchEvent(new MessageEvent('message', {
        data: JSON.stringify(request)
      }));
    };
    
    mcp.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Check if this is a response to our request
        if (data.result && data.result.content && data.result.content[0] && data.result.content[0].text) {
          // Assuming the response contains base64 image data
          result = data.result.content[0].text;
          completed = true;
          
          // Close the connection
          mcp.close();
          clearTimeout(timeout);
          
          // Return the QR code data to the client
          return res.json({
            qrImageBase64: result,
            success: true
          });
        }
      } catch (err) {
        console.error('Error parsing message:', err);
      }
    };
    
    mcp.onerror = (err) => {
      console.error('EventSource error:', err);
      error = err.message || 'Error connecting to MCP.run servlet';
      
      if (!completed) {
        completed = true;
        mcp.close();
        clearTimeout(timeout);
        
        return res.status(500).json({
          error: 'Failed to connect to MCP.run servlet',
          message: error,
          success: false
        });
      }
    };
    
  } catch (error) {
    console.error('Error calling MCP.run servlet:', error.message);
    
    // Provide a more detailed error message
    let errorMessage = 'Failed to generate QR code';
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      errorMessage = `Server error: ${error.response.status}`;
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = 'No response received from MCP.run server';
    }
    
    res.status(500).json({
      error: errorMessage,
      message: error.message,
      success: false
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to use the QR code generator`);
});
