#!/usr/bin/env python3
import os
import urllib.request
import time
import signal
import sys
import json
import ssl
import http.server
import socketserver
from urllib.parse import urlparse, parse_qs
import threading

# Get MCP_SIGNED_URL from environment or .env file
def get_env_var(name, default=None):
    if name in os.environ:
        return os.environ[name]
    try:
        with open('.env', 'r') as f:
            for line in f:
                if '=' in line:
                    var, val = line.strip().split('=', 1)
                    if var == name:
                        return val
    except:
        pass
    return default

MCP_SIGNED_URL = get_env_var('MCP_SIGNED_URL')
if not MCP_SIGNED_URL:
    print("Error: MCP_SIGNED_URL not found in environment or .env file")
    sys.exit(1)

print(f"Connecting to MCP.run with URL: {MCP_SIGNED_URL}")

# Global variable to store QR code responses
qr_responses = {}
mcp_connected = False
request_queue = []
response_condition = threading.Condition()

def signal_handler(sig, frame):
    print('Shutting down...')
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)

# Send a request to MCP.run
def send_mcp_request(text, size, request_id):
    global request_queue
    
    with response_condition:
        request_queue.append({
            "id": request_id,
            "method": "tools/call",
            "params": {
                "name": "generate",
                "arguments": {
                    "text": text,
                    "size": size
                }
            }
        })
        response_condition.notify()

# SSE connection handler - runs in a separate thread
def connect_to_sse():
    global qr_responses, mcp_connected, request_queue
    
    while True:
        try:
            # Create a request with the appropriate headers for SSE
            req = urllib.request.Request(MCP_SIGNED_URL)
            req.add_header('Accept', 'text/event-stream')
            req.add_header('User-Agent', 'Mozilla/5.0 (compatible; MCPClient/1.0)')
            
            # Create a context that ignores SSL certificate verification if needed
            context = ssl._create_unverified_context()
            
            # Open the connection
            print("Attempting to connect...")
            response = urllib.request.urlopen(req, context=context)
            print("Connected to MCP.run")
            mcp_connected = True
            
            # Thread to send queued requests
            def request_sender():
                while mcp_connected:
                    with response_condition:
                        if not request_queue:
                            # Wait for new requests
                            response_condition.wait(timeout=1.0)
                            continue
                        
                        # Get the next request
                        request = request_queue.pop(0)
                        
                    try:
                        # Send the request
                        print(f"Sending request: {request['id']}")
                        message_event = {
                            "data": json.dumps(request)
                        }
                        # This is a placeholder - in Python we need a proper way to send messages
                        # In a real implementation, this would use the appropriate MCP.run messaging mechanism
                        print(f"Would send message: {message_event}")
                    except Exception as e:
                        print(f"Error sending request: {e}")
            
            # Start the request sender thread
            sender_thread = threading.Thread(target=request_sender)
            sender_thread.daemon = True
            sender_thread.start()
            
            # Read the response in chunks
            while True:
                chunk = response.read(1024).decode('utf-8')
                if not chunk:
                    break
                    
                lines = chunk.split('\n')
                for line in lines:
                    line = line.strip()
                    if line.startswith('data:'):
                        data = line[5:].strip()
                        try:
                            event_data = json.loads(data)
                            request_id = event_data.get('id')
                            print(f"Received event for request {request_id}")
                            
                            # Check if this is a QR code response
                            if event_data.get('result') and event_data.get('result').get('content'):
                                for content in event_data['result']['content']:
                                    if content.get('type') == 'text' and content.get('text', '').startswith('data:image/'):
                                        qr_responses[request_id] = {
                                            'qrImageBase64': content['text'],
                                            'timestamp': time.time(),
                                            'success': True
                                        }
                                        print(f"Saved QR code for request {request_id}")
                                        break
                        except Exception as e:
                            print(f"Error parsing message: {e}")
                            
        except Exception as e:
            mcp_connected = False
            print(f"Connection error: {e}")
            print("Connection lost, reconnecting...")
            time.sleep(5)

# Create a simple HTTP server to handle API requests
class MCPProxyHandler(http.server.BaseHTTPRequestHandler):
    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()
    
    def do_GET(self):
        if self.path.startswith('/health'):
            # Health check endpoint
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({
                'status': 'ok',
                'mcp_connected': mcp_connected
            }).encode())
            return
        
        if self.path.startswith('/qrcode'):
            # Parse query parameters
            query = urlparse(self.path).query
            params = parse_qs(query)
            
            text = params.get('text', [''])[0]
            size = params.get('size', ['250'])[0]
            
            if not text:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.send_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': 'Text parameter is required'
                }).encode())
                return
            
            # Generate a unique request ID
            request_id = f"req_{int(time.time() * 1000)}"
            
            # Send the request to MCP.run
            send_mcp_request(text, int(size), request_id)
            
            # Wait for the response (with timeout)
            max_wait = 15  # seconds
            start_time = time.time()
            
            while time.time() - start_time < max_wait:
                if request_id in qr_responses:
                    # We got the response
                    response_data = qr_responses[request_id]
                    
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.send_cors_headers()
                    self.end_headers()
                    self.wfile.write(json.dumps(response_data).encode())
                    
                    # Clean up the response after using it
                    del qr_responses[request_id]
                    return
                
                time.sleep(0.5)
            
            # If we get here, we timed out waiting for a response
            self.send_response(504)  # Gateway Timeout
            self.send_header('Content-type', 'application/json')
            self.send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({
                'error': 'Timeout waiting for MCP.run response',
                'success': False
            }).encode())
            return
        
        # Default not found response
        self.send_response(404)
        self.send_header('Content-type', 'application/json')
        self.send_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps({
            'error': 'Not found'
        }).encode())

# Start the HTTP server
def start_http_server():
    PORT = int(os.environ.get('PORT', 3000))
    handler = MCPProxyHandler
    
    print(f"Starting HTTP server on port {PORT}")
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"HTTP server running on port {PORT}")
        httpd.serve_forever()

# Start the SSE connection in a separate thread
sse_thread = threading.Thread(target=connect_to_sse)
sse_thread.daemon = True
sse_thread.start()

# Start the HTTP server
start_http_server()
