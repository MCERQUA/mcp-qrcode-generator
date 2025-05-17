# MCP.run QR Code Generator

A web application that demonstrates using MCP.run servlets with a web interface.

## Overview

This project was originally designed to use the MCP.run QR code servlet to generate QR codes through a web interface. Due to technical limitations with connecting to MCP.run from serverless functions, the live demo is currently using a third-party QR code API instead.

The repository contains both implementations:
- The MCP.run servlet connection (in `server.js`)
- The third-party API fallback (in the Netlify function)

## Live Demo

You can try the live application at: https://qrcode-mcp.netlify.app/

## Features

- Generate QR codes from any text or URL
- Customize QR code size
- Download generated QR codes

## How It Works

1. User enters text to encode in a QR code through the web interface
2. The request is sent to a Netlify serverless function
3. The function generates a QR code and returns it to the browser
4. The generated QR code is displayed and can be downloaded

## Technical Notes

### MCP.run Connection Issues

When attempting to connect to the MCP.run servlet from a Netlify serverless function, we encountered issues with the Server-Sent Events (SSE) connection. The main challenges were:

1. **Statelessness**: Netlify Functions are stateless and don't maintain persistent connections well
2. **Timeout limitations**: Serverless functions have execution time limits
3. **Environment differences**: The EventSource API behaves differently in Node.js compared to browsers

### Alternative Implementation

The current implementation uses the QRServer.com API to generate QR codes as a fallback. This demonstrates the concept while ensuring the application works reliably.

### Source Code Preservation

Despite the switch to a third-party API, we've preserved the MCP.run implementation in the repository for reference. This includes:

- Server-side code for connecting to MCP.run via SSE
- The signed URL connection method
- Proper error handling

## Future Improvements

- Investigate ways to make SSE connections work from serverless functions
- Consider implementing a small proxy server that can maintain stateful connections
- Explore other MCP.run servlets for additional features

## Setup and Deployment

See the [deployment instructions](DEPLOYMENT.md) for detailed setup steps.

## License

MIT

## Credits

This project uses the QR code servlet concept from [MCP.run](https://mcp.run/nilslice/qr-code).
