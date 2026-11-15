#!/usr/bin/env python3
"""
Seed & Sync BillBook SaaS Data to Firebase Realtime Database
Project: adonaibroadcast-11095
Author: Joy John (joy.john@ybl)
"""

import json
import os
import sys
import urllib.request
import urllib.error
import datetime

DIRECTORY = os.path.dirname(os.path.abspath(__file__))
SEED_FILE = os.path.join(DIRECTORY, "seed_data.json")
FIREBASE_URL = "https://adonaibroadcast-11095.firebaseio.com/billbook.json"

def load_seed_data():
    if not os.path.exists(SEED_FILE):
        print(f"[-] Error: Seed file {SEED_FILE} not found!")
        sys.exit(1)
    with open(SEED_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def seed_to_firebase(data):
    print("=" * 65)
    print("  BillBook SaaS - Firebase Cloud Seed & Sync")
    print(f"  Target: {FIREBASE_URL}")
    print(f"  Timestamp: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 65)
    
    payload = json.dumps(data).encode("utf-8")
    
    try:
        req = urllib.request.Request(
            FIREBASE_URL,
            data=payload,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "BillBook-CloudSync/1.0"
            },
            method="PUT"
        )
        with urllib.request.urlopen(req, timeout=15) as res:
            response_data = res.read().decode("utf-8")
            print("[+] Successfully seeded data to Firebase Realtime Database!")
            print(f"[+] HTTP Status: {res.status}")
            print(f"[+] Business: {data.get('business', {}).get('name')}")
            print(f"[+] Active Subscription: {data.get('subscription', {}).get('planName')}")
            print(f"[+] Invoices Seeded: {len(data.get('invoices', []))}")
            print(f"[+] Items Seeded: {len(data.get('items', []))}")
            print(f"[+] Parties Seeded: {len(data.get('parties', []))}")
            return True
    except urllib.error.HTTPError as e:
        print(f"[-] HTTP Error {e.code}: {e.reason}")
        if e.code in (401, 403):
            print("[-] Note: Firebase Database Rules may require authentication or write permission.")
        return False
    except Exception as e:
        print(f"[-] Connection Error: {e}")
        return False

if __name__ == "__main__":
    seed_data = load_seed_data()
    seed_to_firebase(seed_data)
