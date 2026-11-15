#!/usr/bin/env python3
"""
ProfileGuard — Port 3000 to Port 8000 Gateway
Enables localhost:3000 in user's browser to immediately access ProfileGuard.
"""
import http.server
import socketserver

PORT = 3000
TARGET_HOST = "localhost:8000"

class RedirectHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        target = f"http://{TARGET_HOST}{self.path}"
        self.send_response(302)
        self.send_header("Location", target)
        self.end_headers()

    def do_POST(self):
        target = f"http://{TARGET_HOST}{self.path}"
        self.send_response(307)
        self.send_header("Location", target)
        self.end_headers()

    def do_HEAD(self):
        self.send_response(200)
        self.end_headers()

    def log_message(self, format, *args):
        pass  # Quiet logging

if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), RedirectHandler) as httpd:
        print(f"Gateway listening on port {PORT} -> Redirecting to {TARGET_HOST}")
        httpd.serve_forever()
