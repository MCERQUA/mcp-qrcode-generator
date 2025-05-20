/ server.js - Express server for QR code generator with logo overlay
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');
const axios = require('axios');
const sharp = require('sharp');
const Jimp = require('jimp');
const FormData = require('form-data');
const fs = require('fs');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Set up storage for uploaded files
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from 'public' directory

// Endpoint for generating QR code without logo
app.post('/api/qr-code', (req, res) => {
  try {
    const { text, size = 250 } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text content is required' });
    }

    console.log(`Generating QR code for text: ${text.substring(0, 30)}${text.length > 30 ? '...' : ''} with size ${size}`);
    
    // Use QRServer.com API directly
    const qrServerUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(text)}&size=${size}x${size}&format=png&ecc=H`;
    
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

// Endpoint for generating QR code with logo
app.post('/api/qr-code-with-logo', upload.single('logo'), async (req, res) => {
  try {
    const { text, size = 300 } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text content is required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Logo image is required' });
    }

    console.log(`Generating QR code with logo for text: ${text.substring(0, 30)}${text.length > 30 ? '...' : ''} with size ${size}`);
    
    // First, generate the QR code with high error correction
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(text)}&size=${size}x${size}&format=png&ecc=H`;
    
    // Download the QR code
    const qrCodeResponse = await axios.get(qrCodeUrl, { responseType: 'arraybuffer' });
    const qrCodeBuffer = Buffer.from(qrCodeResponse.data);
    
    // Process the logo (resize and add transparency if needed)
    const logoBuffer = await sharp(req.file.buffer)
      .resize({ width: Math.floor(size * 0.2), height: Math.floor(size * 0.2), fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .toBuffer();
    
    // Load both the QR code and logo with Jimp
    const [qrCodeImage, logoImage] = await Promise.all([
      Jimp.read(qrCodeBuffer),
      Jimp.read(logoBuffer)
    ]);
    
    // Calculate the position to center the logo on the QR code
    const logoX = (qrCodeImage.getWidth() - logoImage.getWidth()) / 2;
    const logoY = (qrCodeImage.getHeight() - logoImage.getHeight()) / 2;
    
    // Composite the logo onto the QR code
    qrCodeImage.composite(logoImage, logoX, logoY, {
      mode: Jimp.BLEND_SOURCE_OVER,
      opacitySource: 1,
      opacityDest: 1
    });
    
    // Convert the result to a base64 string
    const resultBase64 = await qrCodeImage.getBase64Async(Jimp.MIME_PNG);
    
    // Return the result
    res.json({
      qrImageBase64: resultBase64,
      success: true
    });
    
  } catch (error) {
    console.error('Error generating QR code with logo:', error.message);
    
    // Provide a detailed error message
    res.status(500).json({
      error: 'Failed to generate QR code with logo',
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
