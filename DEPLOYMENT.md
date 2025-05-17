# Deployment Instructions

This guide will walk you through the steps to deploy your QR Code generator website that uses the MCP.run QR code servlet.

## Prerequisites

- Node.js (v14 or higher)
- An MCP.run account
- Access to the QR code servlet (https://mcp.run/nilslice/qr-code)
- A hosting platform (like Netlify, Vercel, Heroku, or similar)

## Step 1: Clone the Repository

```bash
git clone https://github.com/MCERQUA/mcp-qrcode-generator.git
cd mcp-qrcode-generator
```

## Step 2: Configure Environment Variables

Create a `.env` file in the root directory with the following content:

```
# MCP.run API Configuration
MCP_API_URL=https://api.mcp.run
MCP_API_KEY=your_mcp_run_api_key_here

# Server Configuration
PORT=3000
```

Replace `your_mcp_run_api_key_here` with your actual MCP.run API key.

## Step 3: Install Dependencies

Run the following command to install all necessary dependencies:

```bash
npm install
```

## Step 4: Test Locally

Start the server locally to ensure everything works:

```bash
npm start
```

Visit `http://localhost:3000` in your browser to test the QR code generator.

## Step 5: Deploy to a Hosting Platform

### Option 1: Deploy to Heroku

1. Create a Heroku account if you don't have one
2. Install the Heroku CLI
3. Log in to Heroku:
   ```bash
   heroku login
   ```
4. Create a new Heroku app:
   ```bash
   heroku create mcp-qrcode-generator
   ```
5. Add your MCP API key to Heroku:
   ```bash
   heroku config:set MCP_API_KEY=your_mcp_run_api_key_here
   ```
6. Deploy your app:
   ```bash
   git push heroku main
   ```
7. Open your deployed app:
   ```bash
   heroku open
   ```

### Option 2: Deploy to Vercel

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```
2. Deploy to Vercel:
   ```bash
   vercel
   ```
3. Set up environment variables in the Vercel dashboard

### Option 3: Deploy to Netlify

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```
2. Deploy to Netlify:
   ```bash
   netlify deploy
   ```
3. Set up environment variables in the Netlify dashboard

## Step 6: Share Your URL

Once deployed, you'll receive a URL for your application (like `https://mcp-qrcode-generator.herokuapp.com` or similar). Share this URL with anyone who needs to use your QR code generator!

## Important Notes

1. Make sure your MCP.run API key is kept secure and not committed to public repositories
2. Verify that you have the necessary permissions to use the QR code servlet on MCP.run
3. Consider implementing rate limiting to prevent abuse of your API

## Troubleshooting

If you encounter issues:

1. Check your MCP.run API key is valid
2. Ensure you have the correct permissions to use the QR code servlet
3. Check your server logs for any error messages
4. Verify your API endpoint URLs are correct
