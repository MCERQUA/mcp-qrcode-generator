// netlify/functions/qr-code.js
const axios = require('axios');
const FormData = require('form-data');
const sharp = require('sharp');
require('dotenv').config();

exports.handler = async (event, context) => {
  // Set CORS headers for preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  // Check if the request method is POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Parse the request body
    const body = JSON.parse(event.body);
    const { text, size = 250, logo } = body;
    
    if (!text) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Text content is required' })
      };
    }

    console.log(`Generating QR code for text: ${text.substring(0, 30)}${text.length > 30 ? '...' : ''} with size ${size}`);
    
    // If no logo is provided, just use QRServer.com
    if (!logo) {
      // Simple QR code generation with QRServer.com
      const qrServerUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(text)}&size=${size}x${size}&format=png&ecc=H`;
      
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          qrImageBase64: qrServerUrl,
          success: true
        })
      };
    } else {
      // Use QR Code Monkey API for custom logo
      const qrMonkeyUrl = "https://api.qrcode-monkey.com/qr/custom";
      
      // Prepare logo data - assuming logo is a base64 string
      const logoData = logo.replace(/^data:image\/\w+;base64,/, "");
      
      // Create payload for QR Code Monkey
      const payload = {
        data: text,
        size: size,
        file: "png",
        download: false,
        logo: logoData
      };
      
      // Call QR Code Monkey API
      const response = await axios.post(qrMonkeyUrl, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Return the QR code with logo
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          qrImageBase64: response.data.qrcode,
          success: true
        })
      };
    }
    
  } catch (error) {
    console.error('Error generating QR code:', error.message);
    
    // Provide a detailed error message
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Failed to generate QR code',
        message: error.message,
        success: false
      })
    };
  }
};
