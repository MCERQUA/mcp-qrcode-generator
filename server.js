// server.js - Proxy server for MCP.run QR code servlet
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from 'public' directory

// MCP.run API endpoint configuration
const MCP_API_URL = process.env.MCP_API_URL || 'https://api.mcp.run';
const MCP_API_KEY = process.env.MCP_API_KEY; // Your API key from mcp.run

// Endpoint to proxy requests to the QR code servlet
app.post('/api/qr-code', async (req, res) => {
  try {
    const { text, size = 250 } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text content is required' });
    }
    
    if (!MCP_API_KEY) {
      return res.status(500).json({ 
        error: 'MCP API key is not configured',
        message: 'Please set the MCP_API_KEY environment variable'
      });
    }
    
    console.log(`Generating QR code for text: ${text.substring(0, 30)}${text.length > 30 ? '...' : ''} with size ${size}`);
    
    // Call MCP.run API to use the QR code servlet
    const response = await axios.post(`${MCP_API_URL}/servlets/nilslice/qr-code/call`, {
      name: 'generate', // The name of the tool in the servlet
      arguments: {
        text: text,
        size: size
      }
    }, {
      headers: {
        'Authorization': `Bearer ${MCP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Return the QR code data to the client
    res.json({
      qrImageBase64: response.data.result, // Assuming the servlet returns base64 image data
      success: true
    });
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
