# NOVA MART — Odoo POS Live Product Catalog

An ultra-fast, modern e-commerce product catalog with live Odoo 18 Point of Sale (POS) real-time inventory tracking and automatic stock deduction.

---

## 🌟 Key Features

- **⚡ Sub-Millisecond Speed:** Native HTML5, modern CSS3, and ES6+ JavaScript.
- **🔄 Live Odoo POS Integration:**
  - Connects securely to Odoo 18 POS via XML-RPC.
  - Real-time stock display on every product (`In Stock`, `Low Stock`, `Out of Stock`).
  - Automatic background sync.
- **🛍️ 3-Page Flow:**
  1. **Products Catalog (`/` or `index.html`):** Fluid grid, dynamic categories, instant search.
  2. **Your Cart (`/cart` or `cart.html`):** Real-time stock verification, instant discounts, mobile number checkout.
  3. **Order Confirmation (`/confirmation` or `confirmation.html`):** Order status tracking, printable receipt with barcode.
- **📦 Atomic Stock Deduction:** When a customer orders, quantities deduct in real time from Odoo inventory.

---

## ⚙️ Environment Variables (`.env`)

Create a `.env` file in the root directory (see `.env.example`):

```env
ODOO_HOST=postest.kodatechnologies.co.tz
ODOO_PORT=443
ODOO_DB=KODADEMOS
ODOO_USERNAME=your_odoo_user@example.com
ODOO_PASSWORD=your_odoo_password
PORT=3000
```

---

## 🚀 Quick Start

### 1. Installation
```bash
git clone https://github.com/BENETHNGOSWE/ERP-PRODUCT-CATALOG.git
cd ERP-PRODUCT-CATALOG
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Start Server
```bash
npm start
# or with PM2:
pm2 start server.js --name "novamart-catalog"
```

Open `http://localhost:3000` in your browser.

---

## 📂 Project Structure

```
├── odoo.js                  # Odoo 18 XML-RPC client & live sync engine
├── server.js                # Express web server & REST API
├── Dockerfile               # Production Docker container
├── package.json             # Node dependencies
├── public/
│   ├── index.html           # Page 1: Products Catalog
│   ├── cart.html            # Page 2: Shopping Cart
│   ├── confirmation.html    # Page 3: Order Confirmation
│   ├── store.js             # Cart state & toast engine
│   ├── style.css            # Responsive styles & animations
│   └── assets/products/     # Product images & logo
```

---

## 📄 License
MIT License. Created for NOVA MART / Koda Technologies.
