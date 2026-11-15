#!/usr/bin/env python3
"""
BillBook SaaS - Local Web Server & Firebase Sync Daemon
Author: Joy John (joy.john@ybl)
"""

import http.server
import socketserver
import os
import sys
import json
import webbrowser
import urllib.request
import urllib.error

PORT = 8090
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
FIREBASE_URL = "https://adonaibroadcast-11095.firebaseio.com/billbook.json"
DATA_FILE = os.path.join(DIRECTORY, "seed_data.json")

class BillBookHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        if self.path == "/api/sync_firebase":
            try:
                content_len = int(self.headers.get('Content-Length', 0))
                post_body = self.rfile.read(content_len)
                
                # Push to Firebase
                req = urllib.request.Request(
                    FIREBASE_URL,
                    data=post_body,
                    headers={"Content-Type": "application/json"},
                    method="PUT"
                )
                try:
                    with urllib.request.urlopen(req, timeout=10) as res:
                        fb_response = res.read().decode('utf-8')
                        self.send_response(200)
                        self.send_header("Content-Type", "application/json")
                        self.end_headers()
                        self.wfile.write(json.dumps({"success": True, "message": "Pushed to Firebase"}).encode('utf-8'))
                        return
                except urllib.error.HTTPError as e:
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps({"success": False, "code": e.code, "reason": e.reason}).encode('utf-8'))
                    return
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
                return

        elif self.path == "/api/save_local":
            try:
                content_len = int(self.headers.get('Content-Length', 0))
                post_body = self.rfile.read(content_len)
                data = json.loads(post_body.decode('utf-8'))
                with open(DATA_FILE, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=2)
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"success": True}).encode('utf-8'))
                return
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
                return

        self.send_response(404)
        self.end_headers()

def start_server(port=PORT):
    for p in range(port, port + 10):
        try:
            handler = BillBookHandler
            with socketserver.TCPServer(("", p), handler) as httpd:
                print("=" * 65)
                print("  BillBook SaaS - GST Invoicing & Billing Platform")
                print(f"  Server URL: http://localhost:{p}")
                print(f"  Firebase:   https://adonaibroadcast-11095.firebaseio.com/billbook")
                print(f"  UPI Gateway: joy.john@ybl (Joy John)")
                print("=" * 65)
                webbrowser.open(f"http://localhost:{p}")
                httpd.serve_forever()
                break
        except OSError:
            print(f"Port {p} is in use, trying {p+1}...")

if __name__ == "__main__":
    start_server()
