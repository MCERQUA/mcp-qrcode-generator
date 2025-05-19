#!/bin/bash
# Oracle Cloud VM setup script for MCP.run QR Code Generator
# This script installs and configures the Python proxy for MCP.run

# Check if run as root and exit if not
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root or with sudo"
  exit 1
fi

echo "===== MCP.run QR Code Generator Setup ====="
echo "This script will set up the Oracle Cloud VM to connect to MCP.run"

# Determine OS type
if [ -f /etc/oracle-release ]; then
  OS_TYPE="oracle"
  echo "Detected Oracle Linux"
elif [ -f /etc/lsb-release ]; then
  OS_TYPE="ubuntu"
  echo "Detected Ubuntu"
else
  echo "Unsupported OS. This script supports Oracle Linux and Ubuntu."
  exit 1
fi

# Install required packages
echo "Installing required packages..."
if [ "$OS_TYPE" == "oracle" ]; then
  yum update -y
  yum install -y python3 python3-pip firewalld
elif [ "$OS_TYPE" == "ubuntu" ]; then
  apt update
  apt install -y python3 python3-pip ufw
fi

# Get MCP_SIGNED_URL from user
echo ""
echo "Please enter your MCP.run signed URL:"
echo "(You can get this from MCP.run by clicking the 'SSE' button in your profile)"
read -p "MCP_SIGNED_URL: " MCP_SIGNED_URL

if [ -z "$MCP_SIGNED_URL" ]; then
  echo "Error: MCP_SIGNED_URL is required"
  exit 1
fi

# Set up the environment file
echo "Creating .env file..."
cd /home/opc
echo "MCP_SIGNED_URL=$MCP_SIGNED_URL" > .env
echo "PORT=3000" >> .env
chown opc:opc .env
chmod 600 .env  # Secure permissions

# Download the Python script
echo "Downloading oracle_proxy.py..."
curl -s https://raw.githubusercontent.com/MCERQUA/mcp-qrcode-generator/main/oracle_proxy.py -o /home/opc/oracle_proxy.py
chown opc:opc /home/opc/oracle_proxy.py
chmod +x /home/opc/oracle_proxy.py

# Create systemd service
echo "Creating systemd service..."
cat > /etc/systemd/system/mcp-client.service << EOF
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

# Configure firewall
echo "Configuring firewall..."
if [ "$OS_TYPE" == "oracle" ]; then
  systemctl enable firewalld
  systemctl start firewalld
  firewall-cmd --permanent --add-port=3000/tcp
  firewall-cmd --reload
elif [ "$OS_TYPE" == "ubuntu" ]; then
  ufw allow 3000/tcp
  ufw --force enable
fi

# Enable and start the service
echo "Enabling and starting MCP client service..."
systemctl daemon-reload
systemctl enable mcp-client.service
systemctl start mcp-client.service

# Check if the service started successfully
if systemctl is-active --quiet mcp-client.service; then
  echo ""
  echo "===== SETUP COMPLETED SUCCESSFULLY ====="
  echo "MCP.run QR Code Generator is now running on this VM"
  echo ""
  echo "Service Status:"
  systemctl status mcp-client.service --no-pager
  
  # Get the public IP address
  PUBLIC_IP=$(curl -s http://checkip.amazonaws.com || curl -s http://ifconfig.me)
  
  echo ""
  echo "You can test the API with:"
  echo "curl http://localhost:3000/health"
  echo ""
  echo "Your API endpoint for the Netlify function is:"
  echo "http://$PUBLIC_IP:3000/qrcode"
  echo ""
  echo "Make sure to update your Netlify environment variables with this endpoint"
else
  echo ""
  echo "===== SETUP FAILED ====="
  echo "There was a problem starting the MCP client service"
  echo "Check the logs for more information:"
  echo "journalctl -u mcp-client.service -e"
fi

echo ""
echo "For more information, refer to the documentation at:"
echo "https://github.com/MCERQUA/mcp-qrcode-generator/blob/main/DEPLOYMENT.md"
