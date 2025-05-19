// netlify/functions/qr-code.js
const axios = require('axios');
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
    
    console.log(`Generating QR code for text: ${text.substring(0, 30)}${text.length > 30 ? '...' : ''} with size ${size}`);
    
    // Oracle Cloud instance API endpoint
    const ORACLE_CLOUD_ENDPOINT = 'http://40.233.105.162:3000/qrcode';
    
    try {
      // First try to use the Oracle Cloud instance that has a persistent connection to MCP.run
      console.log('Trying Oracle Cloud instance...');
      const response = await axios.get(ORACLE_CLOUD_ENDPOINT, {
        params: {
          text,
          size
        },
        timeout: 10000 // 10 second timeout
      });
      
      // Return the QR code to the client
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(response.data)
      };
    } catch (oracleError) {
      console.error('Error calling Oracle Cloud instance:', oracleError.message);
      console.log('Falling back to direct MCP.run connection...');
      
      // If Oracle Cloud is unavailable, try direct MCP.run connection as a fallback
      const MCP_SIGNED_URL = process.env.MCP_SIGNED_URL;
      
      if (!MCP_SIGNED_URL) {
        // If direct MCP connection isn't available, use QRServer.com as a last resort
        console.log('No MCP_SIGNED_URL configured, using QRServer.com fallback...');
        const qrServerUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(text)}&size=${size}x${size}&format=png`;
        
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            qrImageBase64: qrServerUrl,
            success: true,
            note: 'Using fallback QR code service (QRServer.com)'
          })
        };
      }
      
      // Try direct MCP.run connection
      try {
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
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            qrImageBase64,
            success: true,
            note: 'Using direct MCP.run connection'
          })
        };
      } catch (mcpError) {
        console.error('Error with direct MCP.run connection:', mcpError.message);
        
        // If both Oracle Cloud and direct MCP.run fail, use QRServer.com as a last resort
        console.log('Using QRServer.com as final fallback...');
        const qrServerUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(text)}&size=${size}x${size}&format=png`;
        
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            qrImageBase64: qrServerUrl,
            success: true,
            note: 'Using fallback QR code service (QRServer.com)'
          })
        };
      }
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
