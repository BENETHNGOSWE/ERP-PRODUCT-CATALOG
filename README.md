# NOVA MART — Odoo POS Live Product Catalog

An ultra-fast, modern single-page and multi-page e-commerce product catalog with live Odoo 18 Point of Sale (POS) real-time inventory tracking and automatic stock deduction.

---

## 🌟 Key Features

- **⚡ Sub-Millisecond Speed:** Built with pure native HTML5, modular CSS3, and ES6+ JavaScript. Zero framework bloat.
- **🔄 Live Odoo POS Integration:**
  - Connects directly to Odoo 18 POS (`product.product` & `pos.category`).
  - Real-time stock display on every product (`In Stock`, `Low Stock`, `Out of Stock`).
  - Prevents ordering out-of-stock items.
- **🛍️ 3-Page Responsive Workflow:**
  1. **Products Catalog (`/` or `index.html`):** Grid view, dynamic category filters, instant search, quantity steppers starting at 0.
  2. **Your Cart (`/cart` or `cart.html`):** Line-by-line stock validation, instant discount calculation, Tanzanian phone number formatting.
  3. **Order Confirmation (`/confirmation` or `confirmation.html`):** Live Odoo POS order confirmation, printable invoice with barcode.
- **📦 Atomic Stock Deduction:** When a customer places an order, the purchased quantities are deducted directly from Odoo `stock.quant` in real time.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v18+)
- npm

### 2. Installation
```bash
git clone https://github.com/BENETHNGOSWE/ERP-PRODUCT-CATALOG.git
cd ERP-PRODUCT-CATALOG
npm install
```

### 3. Start Server
```bash
npm start
# or with PM2 for 24/7 background operation:
pm2 start server.js --name "novamart-catalog"
```

Open `http://localhost:3000` in your browser.

---

## ⚙️ Odoo Configuration (`odoo.js`)

```javascript
const ODOO_CONFIG = {
  host: 'postest.kodatechnologies.co.tz',
  port: 443,
  db: 'KODADEMOS',
  username: 'developerbeneth@gmail.com',
  password: 'POSIntergration@2026'
};
```

---

## 📂 Project Structure

```
├── odoo.js                  # Odoo 18 XML-RPC client & live sync engine
├── server.js                # Express web server & REST API
├── package.json             # Node dependencies
├── public/
│   ├── index.html           # Page 1: Products Catalog
│   ├── cart.html            # Page 2: Shopping Cart
│   ├── confirmation.html    # Page 3: Order Received
│   ├── store.js             # Shared state & cart logic
│   ├── style.css            # Responsive styles & animations
│   └── assets/products/     # Product images & logo
```

---

## 📄 License
MIT License. Created for NOVA MART / Koda Technologies.
