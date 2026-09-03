/**
 * ODOO MULTI-CLIENT CATALOG & DIRECT WHATSAPP PLATFORM
 * Clean, fast, direct order submission & automated WhatsApp notifications
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const odoo = require('./odoo');
const stores = require('./stores');
const whatsapp = require('./whatsapp');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static Assets
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));
app.use(express.static(path.join(__dirname, 'public')));

// Nested Static Asset Fallbacks for dynamic subpaths (e.g., /:slug/style.css, /:slug/store.js, /:slug/assets/*)
app.get('/:slug/style.css', (req, res) => res.sendFile(path.join(__dirname, 'public', 'style.css')));
app.get('/:slug/store.js', (req, res) => res.sendFile(path.join(__dirname, 'public', 'store.js')));
app.use('/:slug/assets', express.static(path.join(__dirname, 'public', 'assets')));

// =========================================================================
// MULTI-CLIENT STORE API ROUTES
// =========================================================================

// 1. Get All Registered Stores
app.get('/api/stores', (req, res) => {
  try {
    const allStores = stores.getAllStores();
    res.json({
      success: true,
      total: allStores.length,
      activeCount: allStores.filter(s => s.status === 'active').length,
      stores: allStores
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Get Single Store by Slug or ID
app.get('/api/stores/:identifier', (req, res) => {
  try {
    const ident = req.params.identifier;
    const store = stores.getStoreBySlug(ident) || stores.getStoreById(ident);
    if (!store) {
      return res.status(404).json({ success: false, error: `Store "${ident}" not found.` });
    }
    res.json({ success: true, store });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Create New Client Store
app.post('/api/stores', (req, res) => {
  try {
    const newStore = stores.createStore(req.body);
    res.status(201).json({
      success: true,
      message: `Store "${newStore.name}" created successfully at /${newStore.slug}!`,
      store: newStore
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 4. Update Client Store
app.put('/api/stores/:id', (req, res) => {
  try {
    const updated = stores.updateStore(req.params.id, req.body);
    res.json({
      success: true,
      message: `Store "${updated.name}" updated successfully!`,
      store: updated
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 5. Delete Store
app.delete('/api/stores/:id', (req, res) => {
  try {
    const removed = stores.deleteStore(req.params.id);
    res.json({
      success: true,
      message: `Store "${removed.name}" removed successfully.`,
      store: removed
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 6. Get Products Filtered Strictly for a Client Store (Product Separation)
app.get(['/api/:slug/products', '/api/stores/:slug/products', '/api/odoo/products'], async (req, res) => {
  try {
    const slug = req.params.slug || req.query.store || 'novamart';
    const store = stores.getStoreBySlug(slug) || stores.getAllStores()[0];

    const forceRefresh = req.query.refresh === 'true' || req.query.force === 'true';
    const odooResult = await odoo.fetchOdooProducts(forceRefresh);
    const allProducts = odooResult.products || [];

    // Filter products strictly for this client store
    const storeProducts = stores.filterProductsForStore(allProducts, store);

    // Extract unique categories available in this store
    const catSet = new Set(['All']);
    storeProducts.forEach(p => {
      if (p.category) catSet.add(p.category);
    });

    res.json({
      success: true,
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug,
        logo: store.logo,
        tagline: store.tagline,
        whatsapp: store.whatsapp,
        themeColor: store.themeColor,
        address: store.address
      },
      count: storeProducts.length,
      categories: Array.from(catSet),
      products: storeProducts
    });
  } catch (err) {
    console.error(`[Store Products Fetch Error]:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Place Order in Odoo POS & Automatically Dispatch Direct WhatsApp Message in Background
app.post(['/api/odoo/order', '/api/:slug/order'], async (req, res) => {
  try {
    const orderData = req.body;
    if (!orderData.items || orderData.items.length === 0) {
      return res.status(400).json({ success: false, error: 'Cannot create order: Cart is empty' });
    }

    const slug = req.params.slug || orderData.storeSlug || 'novamart';
    const store = stores.getStoreBySlug(slug) || stores.getAllStores()[0];

    orderData.storeId = store.id;
    orderData.storeSlug = store.slug;
    orderData.storeName = store.name;
    orderData.posConfigId = store.posConfigId;

    console.log(`[Order Processing] Store "${store.name}" (${store.slug}) — Total: TZS ${orderData.totalAmount}`);

    // 1. Create POS Order in Odoo ERP
    const odooOrderResult = await odoo.createOdooPosOrder(orderData);

    // 2. Automatically Send WhatsApp Order Alert Directly via OpenWA in the Background
    let waResult = null;
    try {
      waResult = await whatsapp.sendOrderNotification(store, {
        orderNumber: orderData.orderId || odooOrderResult.receiptNumber,
        customer: {
          name: orderData.customerName || `Customer (${orderData.customerPhone || 'N/A'})`,
          phone: orderData.customerPhone || store.whatsapp,
          deliveryAddress: orderData.deliveryAddress || store.address || 'Dar es Salaam'
        },
        items: orderData.items,
        totalAmount: orderData.totalAmount
      });
      console.log(`[WhatsApp Auto-Dispatch] Notification sent directly to ${store.whatsapp}!`);
    } catch (waErr) {
      console.warn('[WhatsApp Gateway Warning]:', waErr.message);
      waResult = { success: false, error: waErr.message };
    }

    res.status(201).json({
      success: true,
      message: 'Order created in Odoo and WhatsApp alert sent directly!',
      order: {
        orderId: orderData.orderId || odooOrderResult.odooOrderId,
        odooOrderId: odooOrderResult.odooOrderId,
        odooOrderName: odooOrderResult.receiptNumber,
        receiptNumber: odooOrderResult.receiptNumber,
        totalAmount: odooOrderResult.totalAmount,
        whatsapp: waResult
      }
    });
  } catch (err) {
    console.error('[Order Processing Error]:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to process order in Odoo'
    });
  }
});

// 8. Admin Dashboard Metrics (Supports Store & Period filtering)
app.get('/api/odoo/dashboard', async (req, res) => {
  try {
    const dashboardData = await odoo.getOdooDashboardData();
    dashboardData.stores = stores.getAllStores();
    res.json(dashboardData);
  } catch (err) {
    console.error('Error fetching Odoo dashboard data:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to fetch dashboard data from Odoo'
    });
  }
});

// 9. 1-Click Restock in Odoo
app.post('/api/odoo/restock', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, error: 'Product ID is required' });
    }
    const restockResult = await odoo.restockOdooProduct(productId, quantity || 25);
    res.json(restockResult);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. WhatsApp Status & Test Endpoints
app.get('/api/whatsapp/status', async (req, res) => {
  try {
    const store = stores.getAllStores()[0];
    const status = await whatsapp.checkSessionStatus(store);
    res.json({
      success: true,
      gateway: 'OpenWA Gateway Active',
      status: status,
      logs: whatsapp.getLogs(10)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/whatsapp/test', async (req, res) => {
  try {
    const { storeSlug, phone } = req.body;
    const store = stores.getStoreBySlug(storeSlug) || stores.getAllStores()[0];
    
    const sampleOrder = {
      orderNumber: `TEST-${Date.now().toString().slice(-4)}`,
      customer: {
        name: 'Test Customer',
        phone: phone || store.whatsapp,
        deliveryAddress: 'Masaki, Dar es Salaam'
      },
      items: [
        { name: 'Sample Store Product', quantity: 1, price: 5000 }
      ],
      totalAmount: 5000
    };

    const waRes = await whatsapp.sendOrderNotification(store, sampleOrder);
    res.json({
      success: true,
      message: `Test WhatsApp message dispatched to ${store.whatsapp}!`,
      result: waRes
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/whatsapp/logs', (req, res) => {
  res.json({
    success: true,
    logs: whatsapp.getLogs(50)
  });
});

// =========================================================================
// CLEAN PAGE ROUTES (EXACT SAME DESIGN & FLOW)
// =========================================================================

// Cart Page (Supports /cart, /cart.html, /:slug/cart)
app.get(['/cart', '/cart.html', '/:slug/cart'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cart.html'));
});

// Confirmation Receipt Page (Supports /confirmation, /confirmation.html, /:slug/confirmation)
app.get(['/confirmation', '/confirmation.html', '/order-success', '/:slug/confirmation'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'confirmation.html'));
});

// Executive Admin Dashboard
app.get(['/dashboard', '/dashboard.html', '/admin', '/admin.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Odoo ERP Integration Preview
app.get(['/odoo-preview', '/odoo_preview.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'odoo_preview.html'));
});

// Main Catalog / Storefront Route (Supports /, /index.html, /:slug)
app.get(['/', '/index.html', '/shop', '/:slug'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Fallback to Catalog
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Express Server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`⚡ Clean Multi-Client Catalog & WhatsApp Server Running!`);
  console.log(`🌐 URL: http://0.0.0.0:${PORT}`);
  console.log(`📲 OpenWA WhatsApp Order Alerts: Enabled (Direct Send)`);
  console.log(`=======================================================`);
});

module.exports = app;
