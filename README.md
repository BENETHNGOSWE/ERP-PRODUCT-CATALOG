# NOVA MART — Online Store

An ultra-fast, modern e-commerce product catalog with real-time inventory tracking and seamless checkout.

---

## 🌟 Key Features

- **⚡ Sub-Millisecond Speed:** Native HTML5, modern CSS3, and ES6+ JavaScript.
- **🔄 Live Inventory Tracking:**
  - Real-time stock display on every product (`In Stock`, `Low Stock`, `Out of Stock`).
  - Automatic stock synchronization.
- **🛍️ 3-Page Flow:**
  1. **Products Catalog (`/` or `index.html`):** Fluid grid, dynamic categories, instant search, click-to-add on images.
  2. **Your Cart (`/cart` or `cart.html`):** Real-time stock verification, instant discounts, mobile number checkout.
  3. **Order Confirmation (`/confirmation` or `confirmation.html`):** Order status tracking, printable receipt with barcode.
- **📦 Stock Management:** Automatic real-time inventory updates on checkout.

---

## 🚀 Quick Start

### 1. Installation
```bash
git clone https://github.com/BENETHNGOSWE/ERP-PRODUCT-CATALOG.git
cd ERP-PRODUCT-CATALOG
npm install
```

### 2. Start Server
```bash
npm start
# or with PM2:
pm2 start server.js --name "novamart-catalog"
```

Open `http://localhost:3000` in your browser.

---

## 📂 Project Structure

```
├── odoo.js                  # XML-RPC client & live sync engine
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
MIT License. Created for NOVA MART.
