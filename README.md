# MCP.run QR Code Generator

A web application that demonstrates using MCP.run servlets with a web interface.

## Overview

This project was designed to use the MCP.run QR code servlet to generate QR codes through a web interface. We've implemented a robust architecture with multiple fallback options to ensure reliability:

1. **Primary Implementation**: Oracle Cloud VM with persistent connection to MCP.run
2. **First Fallback**: Direct connection to MCP.run through Netlify function (if Oracle Cloud is unavailable)
3. **Second Fallback**: Third-party QR code API (if both primary methods fail)

This multi-layered approach ensures the application remains functional even if one or more components experience issues.

## Live Demo

You can try the live application at: [https://qrcode-mcp.netlify.app/](https://qrcode-mcp.netlify.app/)

## Features

- Generate QR codes from any text or URL
- Customize QR code size
- Download generated QR codes
- Reliable operation with multiple fallback mechanisms

## How It Works

1. User enters text to encode in a QR code through the web interface
2. The request is sent to a Netlify serverless function
3. The function tries three approaches in sequence:
   - First, it contacts the Oracle Cloud instance which maintains a persistent connection to MCP.run
   - If that fails, it attempts to connect directly to MCP.run
   - As a last resort, it uses a third-party QR code API
4. The generated QR code is displayed and can be downloaded

## Technical Notes

### Oracle Cloud Implementation

We've implemented a persistent connection to MCP.run on an Oracle Cloud VM using Python. This approach:

- Maintains a continuous connection to the MCP.run SSE endpoint
- Exposes a simple API that the Netlify function can call
- Handles requests efficiently with appropriate error handling
- Automatically reconnects if the connection is lost

### Netlify Serverless Function

The Netlify function acts as a smart proxy that:

1. Attempts to contact the Oracle Cloud instance
2. Falls back to a direct MCP.run connection if Oracle Cloud is unavailable
3. Uses a third-party QR code API as a last resort

### MCP.run Connection Issues

When directly connecting to the MCP.run servlet from a Netlify serverless function, we encountered issues with the Server-Sent Events (SSE) connection. The main challenges were:

1. **Statelessness**: Netlify Functions are stateless and don't maintain persistent connections well
2. **Timeout limitations**: Serverless functions have execution time limits
3. **Environment differences**: The EventSource API behaves differently in Node.js compared to browsers

Our Oracle Cloud implementation addresses these issues by providing a persistent, reliable connection.

## Setup and Deployment

See the [deployment instructions](DEPLOYMENT.md) for detailed setup steps.

### Oracle Cloud Setup

To set up the Oracle Cloud instance:
1. Create an Oracle Cloud VM.Standard.E2.1.Micro instance (Always Free tier)
2. Install Python 3.6+ on the instance
3. Upload the `oracle_proxy.py` script
4. Create a `.env` file with the MCP_SIGNED_URL
5. Set up the script to run as a systemd service for persistence
6. Configure firewall rules to allow traffic on port 3000

## Future Improvements

- Implement better error handling and retry mechanisms
- Add monitoring and alerting for the Oracle Cloud instance
- Enhance the proxy API with additional QR code customization options
- Explore other MCP.run servlets for additional features

## License

MIT

## Credits

This project uses the QR code servlet concept from [MCP.run](https://mcp.run/nilslice/qr-code).
