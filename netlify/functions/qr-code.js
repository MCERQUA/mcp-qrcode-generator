// netlify/functions/qr-code.js
const EventSource = require('eventsource');
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
    
    const MCP_SIGNED_URL = process.env.MCP_SIGNED_URL;
    
    if (!MCP_SIGNED_URL) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'MCP signed URL is not configured',
          message: 'Please set the MCP_SIGNED_URL environment variable'
        })
      };
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
    
    try {
      // Execute the QR code generation
      const qrImageBase64 = await generateQRCode;
      
      // Return the QR code to the client
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          qrImageBase64,
          success: true
        })
      };
    } catch (error) {
      // This is what we want - if MCP fails, we show the error
      return {
        statusCode: 502,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'MCP.run connection failed',
          message: error.message,
          success: false
        })
      };
    }
    
  } catch (error) {
    console.error('Error calling MCP.run servlet:', error.message);
    
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
