# 📦 Complete Guide: How to Load Stock for a Specific Client Store (e.g., `benstore`)

When you create a new store (like **Ben Store** at `achete.me/benstore`), the store starts completely empty with `0` products as a safety guard.

This guide explains how to **load stock specifically for that store** so that **only that store displays its own inventory**, with complete product isolation from all other stores.

---

## 🎯 Overview: The 3 Ways to Load Stock into Your Store

In the Admin Dashboard (**`https://catalog.kodatechnologies.co.tz/dashboard`**), click the blue **`📦 Load Stock`** button next to your store in the **Registered Stores** table.

A dedicated modal will open with 3 options:

```
┌────────────────────────────────────────────────────────────────────────────┐
│         📦 STORE INVENTORY & STOCK MANAGER: Ben Store (achete.me/benstore)  │
├────────────────────────────────────────────────────────────────────────────┤
│  [ 📋 Store Products ]  [ ➕ Quick Add Product ]  [ 🔍 Pick from Odoo ]    │
│                                                                            │
│  Option 1: ➕ Quick Add New Product                                        │
│  • Create brand new items specifically for Ben Store                       │
│  • Set Sales Price, Initial Stock (e.g. 50 units), Category, Photo         │
│                                                                            │
│  Option 2: 🔍 Pick & Assign from Odoo ERP Catalog                          │
│  • Check the boxes for products that belong to Ben Store                   │
│  • Instantly links existing inventory with live ERP quantities             │
│                                                                            │
│  Option 3: 📥 Bulk CSV Import                                              │
│  • Paste: Name, Price, Stock Units, Category, SKU                          │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Step-by-Step Instructions

### 🔹 Method 1: Quick-Add a New Product Specifically for Your Store (Most Common)

1. Open the Admin Dashboard: **`https://catalog.kodatechnologies.co.tz/dashboard`**.
2. Scroll to the **Registered Stores & Catalogues** table.
3. Next to your store (e.g. **Ben Store**), click **`📦 Load Stock`**.
4. In the modal, click the **`➕ Quick Add Product`** tab.
5. Fill in the product details:
   - **Product Name:** e.g., *BenStore Wireless ANC Earbuds*
   - **Category:** e.g., *Electronics*
   - **Sales Price (TZS):** e.g., *65,000*
   - **Initial Stock (Units):** e.g., *50*
   - **Product Photo:** Click **📁 Upload Photo** (or paste an image URL).
   - **SKU / Barcode:** e.g., *BEN-ANC-01*
6. Click **`➕ Save & Add to Store Stock`**.

**Result:**
- The item is saved into Odoo ERP with 50 units in stock.
- The item is **strictly assigned to Ben Store**.
- Opening `https://catalog.kodatechnologies.co.tz/benstore` immediately shows the product with `50 in stock`.
- Client B (e.g., NOVA MART or ABC Store) will **never** see Ben Store's items.

---

### 🔹 Method 2: Pick & Assign Existing Products from Odoo ERP

If you already have products in Odoo ERP and want to allocate them to your store:

1. In the **`📦 Load Stock`** modal for your store, click the **`🔍 Pick from Odoo ERP`** tab.
2. Use the search bar to find products (e.g. search *Juice*, *Charger*, *Oil*, *Shirt*).
3. Check the checkboxes for each product that belongs to this store.
4. Click **`💾 Save Assigned Products to Store`**.

**Result:**
- Only the checked products will appear in your store's catalog.
- The live stock on hand from Odoo ERP is displayed.

---

### 🔹 Method 3: Bulk Import Inventory via CSV / Text

If you have a list of products to load all at once:

1. In the **`📦 Load Stock`** modal, click the **`📥 Bulk CSV Import`** tab.
2. Paste your products, one per line:
   ```csv
   BenStore Wireless ANC Earbuds, 65000, 50, Electronics, BEN-01
   Fast USB-C Braided Cable, 15000, 100, Accessories, BEN-02
   Magnetic Phone Car Mount, 25000, 30, Accessories, BEN-03
   ```
3. Click **`🚀 Import Inventory into Store`**.

---

## 🔄 How Stock Deduction Works When Orders Are Placed

1. **Customer shops on your store:** Customer adds items to cart on `https://catalog.kodatechnologies.co.tz/benstore` and checks out.
2. **Instant Stock Deduction:** 
   - If 3 units are ordered, the on-hand stock drops from `50` &rarr; `47` units in real time.
   - All subsequent visitors see `47 in stock`.
3. **Automated WhatsApp Notification:**
   - The server instantly sends the complete order summary directly to **your store's registered WhatsApp number**:
     ```
     🛍️ NEW ORDER #BEN-ORD-01
     🏪 Store: Ben Store

     👤 Customer: Khalfan Said (+255 766 111 222)
     📞 Phone: +255 766 111 222
     📍 Delivery: Dar es Salaam, Tanzania

     📦 Items Ordered:
     • BenStore Wireless ANC Earbuds × 3 — TZS 195,000

     💰 TOTAL AMOUNT: TZS 195,000
     ```
4. **Order History:** The order is recorded in your Admin Dashboard under **Recent Orders**.

---

## ⚡ Restocking Existing Products

When a product runs low or out of stock:
1. Open the **`📦 Load Stock`** modal for your store (or check the **Out of Stock** table on the dashboard).
2. Click the **`⚡ Restock`** button next to that product.
3. Enter the restock quantity (e.g., `50` units).
4. Click **Confirm Restock** — the store catalog updates immediately!
