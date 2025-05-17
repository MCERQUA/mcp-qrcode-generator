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

## Step 2: Generate a Signed URL from MCP.run

1. Log in to your MCP.run account
2. Navigate to the "Tool Profiles" section
3. Look for the "default" profile (or any profile where you've installed the QR code servlet)
4. Click the "SSE" button
5. In the "Connect Your Client" modal that appears, set the duration for your signed URL (default is 12 months)
6. Click the "Generate URL" button
7. Copy the generated signed URL - you'll need this for the next step

## Step 3: Configure Environment Variables

Create a `.env` file in the root directory with the following content:

```
# MCP.run Configuration
MCP_SIGNED_URL=your_signed_url_from_mcp_run_here

# Server Configuration
PORT=3000
```

Replace `your_signed_url_from_mcp_run_here` with the signed URL you generated in Step 2.

## Step 4: Install Dependencies

Run the following command to install all necessary dependencies:

```bash
npm install
```

## Step 5: Test Locally

Start the server locally to ensure everything works:

```bash
npm start
```

Visit `http://localhost:3000` in your browser to test the QR code generator.

## Step 6: Deploy to a Hosting Platform

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
5. Add your MCP signed URL to Heroku:
   ```bash
   heroku config:set MCP_SIGNED_URL=your_signed_url_from_mcp_run_here
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
3. Set up environment variables in the Vercel dashboard, adding your `MCP_SIGNED_URL`

### Option 3: Deploy to Netlify

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```
2. Deploy to Netlify:
   ```bash
   netlify deploy
   ```
3. Set up environment variables in the Netlify dashboard, adding your `MCP_SIGNED_URL`

## Step 7: Share Your URL

Once deployed, you'll receive a URL for your application (like `https://mcp-qrcode-generator.herokuapp.com` or similar). Share this URL with anyone who needs to use your QR code generator!

## Important Notes

1. Make sure your MCP.run signed URL is kept secure and not committed to public repositories
2. The signed URL has an expiration date, so you'll need to generate a new one when it expires
3. Consider implementing rate limiting to prevent abuse of your API

## Troubleshooting

If you encounter issues:

1. Check that your signed URL is correctly formatted and hasn't expired
2. Ensure you have the correct permissions to use the QR code servlet
3. Check your server logs for any error messages
4. Verify your API endpoint URLs are correct
5. Make sure the EventSource connection is being established properly
