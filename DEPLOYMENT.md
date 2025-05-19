# Deployment Instructions

This guide will walk you through the steps to deploy your QR Code generator website that uses the MCP.run QR code servlet.

## Deployment Overview

The application consists of two main components:
1. **Oracle Cloud VM** - A persistent server that maintains a connection to MCP.run
2. **Netlify Website** - The web frontend and serverless function

## Prerequisites

- Node.js (v14 or higher)
- An MCP.run account
- Access to the QR code servlet (https://mcp.run/nilslice/qr-code)
- An Oracle Cloud account (free tier is sufficient)
- A Netlify account (free tier is sufficient)

## Step 1: Set Up Oracle Cloud VM

### 1.1 Create an Oracle Cloud VM Instance

1. Sign up for Oracle Cloud (if you haven't already)
2. Create a VM.Standard.E2.1.Micro instance (part of the Always Free tier)
   - Choose Oracle Linux or Ubuntu as the operating system
   - Create and download an SSH key pair for access
3. Configure the network security list to allow inbound traffic on port 3000

### 1.2 Connect to Your Oracle Cloud VM

```bash
ssh -i <your-private-key> opc@<instance-ip-address>
```

### 1.3 Install Required Software

For Oracle Linux:
```bash
sudo yum update -y
sudo yum install -y python3 python3-pip
```

For Ubuntu:
```bash
sudo apt update
sudo apt install -y python3 python3-pip
```

### 1.4 Set Up the MCP.run Proxy

1. Upload the `oracle_proxy.py` script to the VM:
   ```bash
   scp -i <your-private-key> oracle_proxy.py opc@<instance-ip-address>:~/
   ```

2. Generate a signed URL from MCP.run:
   - Log in to your MCP.run account
   - Navigate to the "Tool Profiles" section
   - Look for the "default" profile (or any profile where you've installed the QR code servlet)
   - Click the "SSE" button
   - In the "Connect Your Client" modal that appears, set the duration for your signed URL (default is 12 months)
   - Click the "Generate URL" button
   - Copy the generated signed URL

3. Create a `.env` file on the VM:
   ```bash
   echo "MCP_SIGNED_URL=your_signed_url_from_mcp_run_here" > .env
   echo "PORT=3000" >> .env
   ```

4. Test the proxy script:
   ```bash
   python3 oracle_proxy.py
   ```

5. Set up a systemd service for persistence:
   ```bash
   sudo tee /etc/systemd/system/mcp-client.service << 'EOF'
   [Unit]
   Description=MCP.run SSE Client
   After=network.target

   [Service]
   ExecStart=/usr/bin/python3 /home/opc/oracle_proxy.py
   WorkingDirectory=/home/opc
   Restart=always
   User=opc
   Group=opc

   [Install]
   WantedBy=multi-user.target
   EOF

   sudo systemctl daemon-reload
   sudo systemctl enable mcp-client.service
   sudo systemctl start mcp-client.service
   ```

6. Verify the service is running:
   ```bash
   sudo systemctl status mcp-client.service
   curl http://localhost:3000/health
   ```

## Step 2: Deploy the Netlify Website

### 2.1 Clone the Repository

```bash
git clone https://github.com/MCERQUA/mcp-qrcode-generator.git
cd mcp-qrcode-generator
```

### 2.2 Configure Environment Variables

Create a `.env` file in the root directory with the following content:

```
# MCP.run Configuration (Fallback if Oracle Cloud is unavailable)
MCP_SIGNED_URL=your_signed_url_from_mcp_run_here

# Oracle Cloud Configuration
ORACLE_CLOUD_ENDPOINT=http://your_instance_ip:3000
```

Replace `your_signed_url_from_mcp_run_here` with the signed URL you generated earlier, and `your_instance_ip` with your Oracle Cloud VM's IP address.

### 2.3 Install Dependencies

```bash
npm install
```

### 2.4 Test Locally

```bash
npm start
```

Visit `http://localhost:3000` in your browser to test the QR code generator.

### 2.5 Deploy to Netlify

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

4. Set up environment variables in the Netlify dashboard:
   - Go to your site settings in the Netlify dashboard
   - Navigate to "Build & deploy" > "Environment variables"
   - Add your `MCP_SIGNED_URL` and `ORACLE_CLOUD_ENDPOINT` environment variables

## Step 3: Test the Deployment

1. Visit your Netlify URL to ensure the application works
2. Test generating QR codes with different text and URLs
3. Verify that the Oracle Cloud proxy is being used by checking its logs:
   ```bash
   sudo journalctl -u mcp-client.service -f
   ```

## Maintenance and Monitoring

### Oracle Cloud VM Maintenance

- Check the service status regularly:
  ```bash
  sudo systemctl status mcp-client.service
  ```

- View logs for troubleshooting:
  ```bash
  sudo journalctl -u mcp-client.service
  ```

- Restart the service if needed:
  ```bash
  sudo systemctl restart mcp-client.service
  ```

### Signed URL Renewal

Remember that the MCP.run signed URL has an expiration date. Set a calendar reminder to generate a new URL before the current one expires.

## Troubleshooting

### Oracle Cloud VM Issues

1. **Service not starting**: Check the logs for errors:
   ```bash
   sudo journalctl -u mcp-client.service -e
   ```

2. **Connection failures**: Verify the MCP_SIGNED_URL is correct and hasn't expired

3. **Port 3000 not accessible**: Check firewall rules:
   ```bash
   sudo firewall-cmd --list-all
   ```

### Netlify Function Issues

1. **Function timeout**: Netlify functions have a 10-second execution limit. The Oracle Cloud proxy approach helps avoid this limitation.

2. **Environment variables not set**: Verify they're correctly configured in the Netlify dashboard.

3. **CORS issues**: If you encounter CORS errors, check that the Netlify function is setting the appropriate CORS headers.

## Important Notes

1. Make sure your MCP.run signed URL is kept secure and not committed to public repositories
2. The signed URL has an expiration date, so you'll need to generate a new one when it expires
3. Consider implementing rate limiting to prevent abuse of your API
4. Regularly check the Oracle Cloud VM status to ensure the persistent connection is maintained
