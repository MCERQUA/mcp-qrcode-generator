# MCP.run QR Code Generator

A web application that generates QR codes using the MCP.run QR code servlet.

## Overview

This project demonstrates how to integrate with MCP.run servlets from a web application. It provides a simple UI for generating QR codes by connecting to the nilslice/qr-code servlet available in the MCP.run registry.

## Features

- Generate QR codes from any text or URL
- Customize QR code size
- Download generated QR codes
- No MCP.run account required for end users

## How It Works

1. User enters text to encode in a QR code through the web interface
2. The request is sent to our Node.js proxy server
3. The proxy server authenticates with MCP.run and calls the QR code servlet
4. The generated QR code is returned to the user's browser

## Setup

See the [deployment instructions](DEPLOYMENT.md) for detailed setup steps.

## Technologies Used

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- API: MCP.run QR Code servlet

## License

MIT

## Credits

This project uses the QR code servlet from [MCP.run](https://mcp.run/nilslice/qr-code).
