// server.js - Simple Express server for QR code generator
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from 'public' directory

// Simple QR code endpoint that redirects to QRServer.com
app.post('/api/qr-code', (req, res) => {
  try {
    const { text, size = 250 } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text content is required' });
    }

    console.log(`Generating QR code for text: ${text.substring(0, 30)}${text.length > 30 ? '...' : ''} with size ${size}`);
    
    // Use QRServer.com API directly
    const qrServerUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(text)}&size=${size}x${size}&format=png`;
    
    // Return the QR code URL to the client
    res.json({
      qrImageBase64: qrServerUrl,
      success: true
    });
    
  } catch (error) {
    console.error('Error generating QR code:', error.message);
    
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
