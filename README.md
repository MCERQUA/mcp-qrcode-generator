# QR Nova Code Generator

A simple and elegant web application for generating QR codes.

## Overview

This project provides a clean and user-friendly interface for generating QR codes. It uses a reliable third-party API (QRServer.com) to create high-quality QR codes that work with any modern smartphone.

## Live Demo

You can try the live application at: [https://qrcode-mcp.netlify.app/](https://qrcode-mcp.netlify.app/)

## Features

- Generate QR codes from any text or URL
- Customize QR code size
- Download generated QR codes
- Mobile-friendly interface
- Fast and reliable operation

## How It Works

1. User enters text to encode in a QR code through the web interface
2. The request is sent to a Netlify serverless function
3. The function connects to QRServer.com API to generate the QR code
4. The generated QR code is displayed and can be downloaded

## Technical Notes

The application uses a simple architecture:

- Frontend: HTML, CSS, and JavaScript
- Backend: Netlify Functions with Node.js
- QR Code Generation: QRServer.com API

## Setup and Deployment

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/MCERQUA/mcp-qrcode-generator.git
   cd mcp-qrcode-generator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

### Netlify Deployment

1. Fork this repository to your GitHub account
2. Log in to Netlify and create a new site from your forked repository
3. Deploy with the following settings:
   - Build command: `npm install`
   - Publish directory: `public`

## Future Improvements

- Add color customization options
- Implement error correction level selection
- Add logo overlay capabilities
- Support for different QR code formats (vCard, WiFi, etc.)

## License

MIT

## Credits

- QR code generation powered by [QRServer.com](https://qrserver.com/)
- UI design and development by Echo AI Systems
