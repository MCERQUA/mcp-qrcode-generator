// server.js - Proxy server for MCP.run QR code servlet using Server-Sent Events
const express = require('express');
const cors = require('cors');
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
const MCP_SIGNED_URL = process.env.MCP_SIGNED_URL;

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
    
    // Create a Promise to handle the asynchronous EventSource connection
    const generateQRCode = new Promise((resolve, reject) => {
      const mcp = new EventSource(MCP_SIGNED_URL);
      let requestId = Date.now().toString();
      let responseReceived = false;
      
      // Set a timeout to handle connection issues
      const timeout = setTimeout(() => {
        if (!responseReceived) {
          mcp.close();
          reject(new Error('Request timed out after 30 seconds'));
        }
      }, 30000);
      
      mcp.onopen = () => {
        console.log('Connected to MCP.run servlet');
        
        // Define the request to the servlet
        const request = {
          id: requestId,
          method: 'tools/call',
          params: {
            name: 'generate',
            arguments: {
              text,
              size
            }
          }
        };
        
        // Send the request
        mcp.dispatchEvent(new MessageEvent('message', {
          data: JSON.stringify(request)
        }));
      };
      
      mcp.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received message:', data);
          
          // Check if this is a response to our request
          if (data.id === requestId && data.result) {
            responseReceived = true;
            clearTimeout(timeout);
            
            // Extract the QR code content
            if (data.result.content && data.result.content.length > 0) {
              // Find the text content with the QR code image
              const qrContent = data.result.content.find(content => 
                content.type === 'text' && content.text && content.text.startsWith('data:image/')
              );
              
              if (qrContent && qrContent.text) {
                mcp.close();
                resolve(qrContent.text);
              } else {
                mcp.close();
                reject(new Error('No QR code in response'));
              }
            } else {
              mcp.close();
              reject(new Error('Invalid response structure'));
            }
          }
        } catch (err) {
          console.error('Error parsing message:', err);
        }
      };
      
      mcp.onerror = (err) => {
        console.error('EventSource error:', err);
        mcp.close();
        clearTimeout(timeout);
        reject(new Error('Error connecting to MCP.run servlet'));
      };
    });
    
    // Execute the QR code generation
    const qrImageBase64 = await generateQRCode;
    
    // Return the QR code to the client
    res.json({
      qrImageBase64,
      success: true
    });
    
  } catch (error) {
    console.error('Error calling MCP.run servlet:', error.message);
    
    // Provide a detailed error message
    res.status(500).json({
      error: 'Failed to generate QR code',
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
