# Deployment Instructions

This guide will walk you through the steps to deploy your QR Code generator website.

## Deployment Overview

The application consists of two main components:
1. **Express Server** - A Node.js server for local development
2. **Netlify Website** - The web frontend and serverless function for production

## Prerequisites

- Node.js (v14 or higher)
- A Netlify account (free tier is sufficient)

## Step 1: Local Development Setup

### 1.1 Clone the Repository

```bash
git clone https://github.com/MCERQUA/mcp-qrcode-generator.git
cd mcp-qrcode-generator
```

### 1.2 Install Dependencies

```bash
npm install
```

### 1.3 Configure Environment Variables (Optional)

Create a `.env` file in the root directory with the following content:

```
PORT=3000
```

### 1.4 Run the Application Locally

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser to test the QR code generator.

## Step 2: Deploy to Netlify

### 2.1 Using Netlify CLI

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Initialize Netlify:
   ```bash
   netlify init
   ```

3. Deploy to Netlify:
   ```bash
   netlify deploy --prod
   ```

### 2.2 Using Netlify Web Interface

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Login to your Netlify account and click "New site from Git"

3. Select your repository and configure the following settings:
   - Build command: `npm install`
   - Publish directory: `public`

4. Click "Deploy site"

## Step 3: Test the Deployment

1. Visit your Netlify URL to ensure the application works
2. Test generating QR codes with different text and URLs
3. Verify that the generated QR codes scan correctly with a mobile device

## Maintenance and Monitoring

### Netlify Site Analytics

Netlify provides basic analytics for your site. You can view:
- Site traffic
- Function invocations
- Error rates

### Netlify Function Logs

To troubleshoot function issues:
1. Go to your site dashboard in Netlify
2. Navigate to "Functions"
3. Select the function you want to inspect
4. View the execution logs

## Troubleshooting

### Local Server Issues

1. **Port already in use**: 
   ```bash
   lsof -i :3000
   ```
   Then kill the process using the identified PID:
   ```bash
   kill -9 <PID>
   ```

### Netlify Function Issues

1. **Function timeout**: Netlify functions have a 10-second execution limit.

2. **Environment variables not set**: Verify they're correctly configured in the Netlify dashboard.

3. **CORS issues**: If you encounter CORS errors, check that the Netlify function is setting the appropriate CORS headers.

## Important Notes

1. The QRServer.com API is used as the backend service for generating QR codes
2. This API has usage limits, so consider implementing rate limiting for production use
3. For high-traffic sites, you might want to consider a premium QR code generation service
