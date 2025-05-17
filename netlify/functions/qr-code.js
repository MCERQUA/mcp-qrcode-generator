// netlify/functions/qr-code.js
const axios = require('axios');
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
    const { text, size = 250 } = body;
    
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
    
    // Use a simple third-party QR code API instead of MCP.run for now
    // This will help determine if the issue is with MCP.run or the Netlify function itself
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(text)}&size=${size}x${size}&format=png`;
    
    const response = await axios.get(qrApiUrl, {
      responseType: 'arraybuffer'
    });
    
    // Convert the image data to base64
    const imageBuffer = Buffer.from(response.data, 'binary');
    const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;
    
    // Return the QR code to the client
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        qrImageBase64: base64Image,
        success: true
      })
    };
    
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
