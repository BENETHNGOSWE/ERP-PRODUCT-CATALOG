# ACHETE.ME — Multi-Client Digital Storefront & WhatsApp Platform

An ultra-fast, modern e-commerce product catalog with real-time inventory tracking, multi-client shop isolation, and seamless WhatsApp order dispatch (`achete.me/{shop_slug}`).

---

## 🌟 Key Features

- **⚡ Sub-Millisecond Speed:** Native HTML5, modern CSS3, and ES6+ JavaScript.
- **🏬 Multi-Client Store Isolation:** Each shop operates with its own custom URL (`achete.me/shopname`), isolated stock on hand, custom pricing, and WhatsApp integration.
- **🔄 Live Inventory Tracking:**
  - Real-time stock display on every product (`In Stock`, `Low Stock`, `Out of Stock`).
  - Automatic stock synchronization.
- **🛍️ Seamless Storefront Flow:**
  1. **Products Catalog (`achete.me/{slug}`):** Fluid grid, dynamic categories, instant search, click-to-add on images.
  2. **Your Cart (`achete.me/{slug}/cart`):** Real-time stock verification, instant discounts, mobile checkout.
  3. **Order Confirmation (`achete.me/{slug}/confirmation`):** Order status tracking, printable receipt with barcode.
- **📲 Direct WhatsApp Order Dispatch:** Automated WhatsApp order notifications to the store's registered number.

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
pm2 start server.js --name "achete-catalog"
```

Open `http://localhost:3000` or `https://achete.me` in your browser.

---

## 📂 Project Structure

```
├── odoo.js                  # XML-RPC client & live sync engine
├── server.js                # Express web server & REST API
├── stores.js                # Multi-client store manager & stock isolation
├── orders.js                # Order recording & live feeds
├── whatsapp.js              # Multi-provider WhatsApp dispatcher
├── Dockerfile               # Production Docker container
├── package.json             # Node dependencies
├── public/
│   ├── index.html           # Page 1: Products Catalog
│   ├── cart.html            # Page 2: Shopping Cart
│   ├── confirmation.html    # Page 3: Order Confirmation
│   ├── dashboard.html       # Client Admin Portal & Store Inventory Manager
│   ├── store.js             # Cart state & toast engine
│   ├── style.css            # Responsive styles & animations
│   └── assets/products/     # Product images & logo
```

---

## 📄 License
MIT License. Created for ACHETE.ME.
