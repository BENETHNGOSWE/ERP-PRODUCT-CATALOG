# 📦 Complete Guide: How to Add Products & Stock to Your Store

This guide explains step-by-step how to add products and stock to any client store on **Achete.me / NOVA Catalog**, and how customers see them live on their personalized storefront (`achete.me/{shop_slug}`).

---

## 🏗️ How the System Architecture Works

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           1. ODOO 18 ERP                                 │
│  • Products & Pricing (Sales Price, Barcode/SKU, Image)                  │
│  • Inventory / Stock on Hand (stock.quant / qty_available)               │
│  • POS Configurations (Website Orders, Mangi shop, Min Market, etc.)     │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │ (Real-time XML-RPC Sync)
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                  2. ACHETE.ME STORE PLATFORM & ENGINE                    │
│  • Multi-Client Isolation (Product Separation by Store)                  │
│  • Client Branding (Uploaded Logo, Name, WhatsApp Number)                │
│  • Stock Guard (Empty state until inventory is loaded)                   │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌───────────────────────────────────────┐   ┌───────────────────────────────────────┐
│       3. CUSTOMER STOREFRONT          │   │      4. ADMIN EXECUTIVE DASHBOARD     │
│   `achete.me/{shop_slug}`             │   │   `catalog.../dashboard`              │
│  • Live stock badges & prices         │   │  • 1-Click Restock Tool               │
│  • Instant cart & checkout            │   │  • Edit Store & Logo Upload           │
│  • Automated WhatsApp Order Alert     │   │  • Order History & Stock Monitor      │
└───────────────────────────────────────┘   └───────────────────────────────────────┘
```

---

## 🚀 Step-by-Step Flow: Adding Stock to Your Store

You have **two easy methods** to add products and manage stock:
- **Method A:** Using the **NOVA Admin Dashboard (1-Click Restock & Store Editor)**
- **Method B:** Adding New Products & Inventory directly in **Odoo 18 ERP**

---

### 🔹 METHOD A: Using the Admin Dashboard (Fastest)

#### Step 1: Open the Admin Dashboard
1. Navigate to: **`https://catalog.kodatechnologies.co.tz/dashboard`**
2. In the top-right corner, click **⚡ Sync Odoo** to ensure you have the latest data.

#### Step 2: Configure Your Store & Link Keywords
1. Scroll down to **Registered Stores & Catalogues**.
2. Click **`✏️ Edit`** next to your store.
3. In the **Product Keywords / Allowed Categories** box:
   - Add keywords matching the products you sell (e.g. `juice, water, rice, soap, oil`).
   - *(Note: If this box is left empty, the store remains protected in "Stock Not Loaded" state).*
4. Attach or update your **Store Logo** (click **📁 Attach Logo File** to upload from your phone/computer).
5. Click **Save Changes**.

#### Step 3: Restock Products with 1-Click
1. In the **Out of Stock Products / Inventory Monitor** table:
2. Find the product you want to add stock for.
3. Click the green **⚡ Restock** button next to that product.
4. Enter the units (e.g. `50` or `100`).
5. Click **Confirm Restock in Odoo**.
6. The system instantly updates Odoo ERP and your store!

---

### 🔹 METHOD B: Adding New Products & Stock in Odoo 18 ERP

If you want to create brand new items with custom barcodes, images, and prices:

#### Step 1: Log in to Odoo 18 ERP
- **URL:** `https://postest.kodatechnologies.co.tz`
- **Database:** `KODADEMOS`

#### Step 2: Create a New Product
1. Go to: **Point of Sale ➔ Products ➔ Products** (or **Inventory ➔ Products**).
2. Click **New** (Create).
3. Fill in the product details:
   - **Product Name:** e.g., *Mwanza Super Rice 25kg*
   - **Sales Price:** e.g., *75,000 TZS*
   - **Product Type:** *Goods / Storable Product* (`is_storable = True`)
   - **Internal Reference / Barcode:** e.g., *RICE-MW-25KG*
   - **Point of Sale Tab:** Check `Available in POS` ✅
   - **Product Image:** Upload the photo of the product.
4. Click **Save**.

#### Step 3: Add On-Hand Stock (Quantity)
1. Inside the product form, click the **Update Quantity** smart button (top right).
2. Set the **Counted Quantity** (e.g., `50` units).
3. Click **Apply**.
4. *(Alternative)*: Go to **Inventory ➔ Physical Inventory / Operations ➔ Inventory Adjustment**, set quantity, and click **Apply**.

---

## 👁️ How the Customer Sees Your Stock Live

When you add stock, here is what happens for the customer:

1. **Customer opens your link:** `https://catalog.kodatechnologies.co.tz/{your_store_slug}` (e.g., `achete.me/abcstore`).
2. **Dynamic Header Branding:** Your uploaded **Store Logo**, shop name, and "Open" badge render at the top.
3. **Stock Badges:**
   - **In Stock:** Displays green badge (`50 in stock`).
   - **Low Stock:** Displays amber badge (`Only 3 left`) when stock is &le; 5 units.
   - **Out of Stock:** Displays red badge (`Out of stock`) and disables add-to-cart.
   - **No Stock Loaded Yet:** If a new store has 0 products assigned, it shows a clean message with a direct WhatsApp contact button.

---

## 🔄 What Happens When a Customer Places an Order?

1. **Cart & Mobile Checkout:** The customer adds items to cart and enters their phone number at `/{your_store_slug}/cart`.
2. **Instant Stock Deduction:**
   - The product's on-hand stock decreases immediately by the ordered quantity in memory and in Odoo 18 (`stock.quant`).
   - Subsequent visitors instantly see the updated, reduced stock.
3. **Order Recording in ERP & Dashboard:**
   - A POS Order is created and marked **Paid** in Odoo 18 (`Point of Sale ➔ Orders ➔ Orders`).
   - The order is logged in `data/orders.json` and appears under **Recent Orders** on your Admin Dashboard.
4. **Automated WhatsApp Notification:**
   - The server automatically sends a formatted WhatsApp order summary to **your registered WhatsApp number**:
     ```
     🛍️ NEW ORDER #NM-4821
     🏪 Store: ABC Store

     👤 Customer: John (+255 712 345 678)
     📞 Phone: +255 712 345 678
     📍 Delivery: Masaki, Dar es Salaam

     📦 Items Ordered:
     • Mwanza Super Rice 25kg × 1 — TZS 75,000
     • Azam Mango Juice 500ml × 2 — TZS 3,000

     💰 TOTAL AMOUNT: TZS 78,000
     ```
5. **Confirmation Receipt:** The customer gets a confirmation screen with Order #, receipt summary, and a direct **"📲 Chat with Store on WhatsApp"** button.

---

## 📋 Quick Reference Table

| Goal | Where to do it | Action |
| :--- | :--- | :--- |
| **Create New Store & Attach Logo** | Dashboard (`/dashboard`) | Click **+ Add Store**, attach logo from computer, set WhatsApp number and slug. |
| **Edit Store Details or Change Logo** | Dashboard (`/dashboard`) | Click **✏️ Edit** in the Stores table, upload new logo or update WhatsApp. |
| **Quick Restock Existing Product** | Dashboard (`/dashboard`) | Click **⚡ Restock** in Out of Stock table, enter quantity & confirm. |
| **Add Brand New Product** | Odoo 18 ERP | **Point of Sale ➔ Products ➔ New**, check `Available in POS`, click **Update Quantity**. |
| **View Live Storefront** | Browser | Open `https://catalog.kodatechnologies.co.tz/{slug}` |
| **View Live Orders** | Dashboard / Odoo | Open `/dashboard` or in Odoo: **Point of Sale ➔ Orders ➔ Orders**. |
