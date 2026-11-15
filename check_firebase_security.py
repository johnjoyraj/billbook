#!/usr/bin/env python3
"""
Firebase Security & Connectivity Tester for BillBook
Target: https://adonaibroadcast-11095.firebaseio.com/billbook
"""

import urllib.request
import urllib.error
import json
import sys

FIREBASE_URL = "https://adonaibroadcast-11095.firebaseio.com/billbook"

print("=" * 65)
print("  BillBook SaaS - Firebase Security & Connectivity Check")
print(f"  Target: {FIREBASE_URL}")
print("=" * 65)

print("\n[Test 1] Testing Read Access at /billbook.json...")
try:
    req = urllib.request.Request(f"{FIREBASE_URL}.json?shallow=true", headers={'User-Agent': 'SecurityAudit/1.0'})
    res = urllib.request.urlopen(req, timeout=10)
    data = res.read().decode('utf-8')
    print("  [+] Read Test: Endpoint responds successfully!")
    print(f"  [+] Data snapshot: {data[:120]}...")
except urllib.error.HTTPError as e:
    print(f"  [!] HTTP {e.code}: {e.reason}")
except Exception as e:
    print(f"  [!] Error: {e}")

print("\n[Test 2] Testing Write Access at /billbook/health_check.json...")
try:
    req = urllib.request.Request(
        f"{FIREBASE_URL}/health_check.json",
        data=b'{"status": "ok", "app": "billbook-saas"}',
        headers={'Content-Type': 'application/json'},
        method='PUT'
    )
    res = urllib.request.urlopen(req, timeout=10)
    print("  [+] Write Test: Successfully updated health check!")
    # Clean up
    req_del = urllib.request.Request(f"{FIREBASE_URL}/health_check.json", method='DELETE')
    urllib.request.urlopen(req_del, timeout=10)
    print("  [+] Cleanup: Health check record cleaned up.")
except urllib.error.HTTPError as e:
    print(f"  [!] HTTP {e.code}: {e.reason}")
except Exception as e:
    print(f"  [!] Error: {e}")

print("\n" + "=" * 65)
print("  Audit Finished.")
print("=" * 65)
