# BillBook SaaS - Professional GST Billing, Inventory & Subscription Platform

> A full-featured, open-architecture GST Invoicing, Point of Sale (POS), Inventory & Accounting Platform engineered as an enterprise-grade clone of **MyBillBook (FloBiz)**. Built with modern web technologies, offline-first LocalStorage caching, and real-time cloud synchronization powered by **Firebase** (`adonaibroadcast-11095`) and **GitHub** (`johnjoyraj/billbook`).

---

## 🌟 Key Features & Functional Modules

### 1. 📊 Executive Dashboard & Real-Time KPIs
- **Live Financial Overview**: Instant calculation of **Total Sales**, **Receivables ("You'll Get")**, **Payables ("You'll Give")**, and **Liquid Cash/Bank Balance**.
- **Low Stock Sentinel**: Automatic threshold monitoring with instant alerts when any inventory item falls below minimum safety stock.
- **Recent Invoices Ledger**: Quick access table displaying customer status, bill numbers, amounts, and one-click actions.

### 2. ⚡ Quick POS Retail Counter (Point-of-Sale)
- **Touch-Friendly & Barcode-Ready**: Click-to-add product catalog with instant search by item code or name.
- **Dynamic Cart Management**: Real-time quantity adjustment, automated GST tax calculation, and subtotal computation.
- **Instant Thermal Receipt Printer**: Generates standard **80mm / 58mm thermal receipts** complete with company header, itemized list, grand total, and a **Live Dynamic UPI QR Code** for customer scan-to-pay.

### 3. 🧾 Full GST Invoicing Engine
- **Authentic Format**: Built on the exact invoice styling and DOM structure from MyBillBook's official engine (`invoice-pdf.html`).
- **Automated Tax Splitting**: Automatically determines **Intra-State (CGST 50% + SGST 50%)** vs **Inter-State (IGST 100%)** supply based on the customer's state code vs the company's state code.
- **Rupees in Words Generator**: Automatically converts grand totals to Indian Currency notation (*"Rupees Twenty-Two Thousand Ninety Only"*).
- **Dynamic Bank & UPI QR Code**: Every invoice renders an interactive UPI QR code (`upi://pay?pa=joy.john@ybl&pn=Joy%20John&am=...&cu=INR`) for instant collections via GPay, PhonePe, Paytm, and BHIM.
- **WhatsApp Direct Sharing**: One-click deep link to send invoices directly to customer WhatsApp numbers with payment links.

### 4. 📦 Stock & Multi-Godown Inventory
- Comprehensive catalog tracking **SKU Code**, **Barcode**, **HSN/SAC Code**, **Cost Price**, **Sale Price**, and **Tax Rates (0%, 5%, 12%, 18%, 28%)**.
- Fast stock adjustment tool with automatic audit logging.

### 5. 👥 Parties Ledger (Customers & Vendors)
- Complete directory of customers and vendors with **GSTIN**, **Credit Limits**, **Opening Balances**, and **Current Balances**.
- Automated WhatsApp payment reminders with personalized overdue balances and UPI payment links.

### 6. 📈 GST & Tax Reports (Filing Ready)
- **GSTR-1 Tax Summary**: Automatic segregation into **B2B (Registered GST Dealers)** and **B2C (Unregistered Retail Sales)**.
- Detailed tax calculation tables with taxable values and tax collected for seamless monthly/quarterly GST returns.

---

## 💎 Subscription Plans & Pricing Architecture

Extracted and modeled directly from MyBillBook's current pricing:

| Tier | Monthly Rate | Yearly Rate (20% Off) | Businesses | Users | Warehouses (Godowns) | Core Capabilities |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Plus** | ₹349 / mo | ₹291 / mo | 1 Business | 1 User + 1 CA | 1 Godown | Unlimited GST Invoices, Custom Themes, Online Digital Store, Barcodes, Basic Inventory |
| **Pro** | ₹399 / mo | ₹333 / mo | 1 Business | 1 User + 1 CA | 2 Godowns | *All Plus features* + Desktop App access, Multi-Godown tracking, Batch/Expiry tracking, Thermal POS slips |
| **Pro Max** | ₹1,026 / mo | **₹570 / mo** | 2-5 Businesses | 10 Users + 2 CA | 5 Godowns | *All Pro features* + E-Invoices, Automated E-Way Bills, Multi-User RBAC, Tally & Excel Export |
| **Multi-Year** | Custom | **Up to 65% Off** | Unlimited | Unlimited | Unlimited | Full Enterprise Multi-Firm, Dedicated Cloud Node, API Webhooks |

---

## ☁️ Cloud Architecture & Firebase Setup

- **Firebase Project**: `adonaibroadcast-11095`
- **Database Base Endpoint**: `https://adonaibroadcast-11095.firebaseio.com/billbook`
- **Official Payment Gateway UPI**: `joy.john@ybl` (Joy John)
- **Dual-Mode Persistence**:
  1. **Zero-Latency Local Mode**: Instant reads and offline writes via browser `localStorage` and `seed_data.json`.
  2. **Background Cloud Sync**: Automatically persists data to Firebase Realtime Database upon any update or via the header **"Sync Cloud"** button.

### Firebase Scripts:
- `export_and_seed_firebase.py`: Seeds business data, inventory, parties, and invoices into Firebase.
- `check_firebase_security.py`: Tests connectivity, shallow reads, and database rules.
- `database.rules.json`: Production rules enforcing authentication and security.

---

## 🚀 Quick Start & Launch Instructions

### 1. Launch Local Server
Double-click `START_BILLBOOK_APP.bat` or run:
```bash
python server.py
```
This automatically starts the server at `http://localhost:8090` and opens the platform in your browser.

### 2. Push to GitHub
Double-click `DEPLOY_TO_GITHUB.bat` or run:
```bash
git init
git branch -M main
git remote add origin https://github.com/johnjoyraj/billbook.git
git add .
git commit -m "feat: complete BillBook SaaS GST billing & subscription platform"
git push -u origin main
```
