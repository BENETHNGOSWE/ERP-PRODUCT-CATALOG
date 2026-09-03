/**
 * ACHETE.ME — Odoo Multi-Client Digital Storefront & WhatsApp Platform
 * 
 * Multi-Client Architecture:
 * - Dynamic URL routing: achete.me/:shop_slug (e.g. /abcstore, /novamart, /crownshop)
 * - Strict Product & Data separation per client
 * - Automated WhatsApp order dispatch via OpenWA gateway
 * - Centralized Multi-Client Super Admin Dashboard
 * - Full 2-way Odoo 18 XML-RPC synchronization
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

// 2. Get Single Store Details by Slug or ID
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

// 5. Delete / Archive Store
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
app.get(['/api/:slug/products', '/api/stores/:slug/products'], async (req, res) => {
  try {
    const slug = req.params.slug;
    const store = stores.getStoreBySlug(slug) || stores.getStoreById(slug);
    if (!store) {
      return res.status(404).json({ success: false, error: `Store "${slug}" not found.` });
    }

    const forceRefresh = req.query.refresh === 'true';
    const odooResult = await odoo.fetchOdooProducts(forceRefresh);
    const allProducts = odooResult.products || [];

    // Filter strictly for this client store
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
    console.error(`[Store Products Error for ${req.params.slug}]:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Place Order for Client Store + Auto-Dispatch WhatsApp Notification
app.post(['/api/:slug/order', '/api/odoo/order'], async (req, res) => {
  try {
    const slug = req.params.slug || req.body.storeSlug || 'abcstore';
    const store = stores.getStoreBySlug(slug) || stores.getStoreById(slug) || stores.getAllStores()[0];

    const orderData = req.body;
    if (!orderData.items || orderData.items.length === 0) {
      return res.status(400).json({ success: false, error: 'Cannot create order: Cart is empty' });
    }

    // Attach store metadata
    orderData.storeId = store.id;
    orderData.storeSlug = store.slug;
    orderData.storeName = store.name;
    orderData.posConfigId = store.posConfigId;

    console.log(`[Multi-Client Order] Placing order for Store "${store.name}" (${store.slug}) — Total: TZS ${orderData.totalAmount}`);

    // 1. Create POS Order in Odoo
    const odooOrderResult = await odoo.createOdooPosOrder(orderData);

    // 2. Dispatch Automated WhatsApp Notification to Client WhatsApp Number
    let waResult = null;
    try {
      waResult = await whatsapp.sendOrderNotification(store, {
        orderNumber: orderData.orderNumber || odooOrderResult.receiptNumber,
        customer: orderData.customer,
        items: orderData.items,
        totalAmount: orderData.totalAmount,
        deliveryFee: orderData.deliveryFee || 0
      });
    } catch (waErr) {
      console.error('[WhatsApp Notification Warning]:', waErr.message);
      waResult = { success: false, error: waErr.message };
    }

    res.status(201).json({
      success: true,
      message: `Order #${orderData.orderNumber || odooOrderResult.odooOrderId} placed successfully for ${store.name}!`,
      store: {
        name: store.name,
        slug: store.slug,
        whatsapp: store.whatsapp
      },
      odooOrderId: odooOrderResult.odooOrderId,
      receiptNumber: odooOrderResult.receiptNumber,
      totalAmount: odooOrderResult.totalAmount,
      whatsapp: waResult
    });
  } catch (err) {
    console.error('[Multi-Client Order Placement Error]:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to process order in Odoo'
    });
  }
});

// =========================================================================
// WHATSAPP GATEWAY & LOGS API
// =========================================================================

// WhatsApp Status & Session Health
app.get('/api/whatsapp/status', async (req, res) => {
  try {
    const storeSlug = req.query.store || 'abcstore';
    const store = stores.getStoreBySlug(storeSlug) || stores.getAllStores()[0];
    const status = await whatsapp.checkSessionStatus(store);
    res.json({
      success: true,
      gateway: 'OpenWA Gateway',
      store: store.name,
      sessionStatus: status,
      logs: whatsapp.getLogs(10)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Send Test WhatsApp Message
app.post('/api/whatsapp/test', async (req, res) => {
  try {
    const { storeSlug, phone, customMessage } = req.body;
    const store = stores.getStoreBySlug(storeSlug) || stores.getAllStores()[0];
    
    const sampleOrder = {
      orderNumber: `TEST-${Date.now().toString().slice(-4)}`,
      customer: {
        name: 'Test Customer',
        phone: phone || store.whatsapp,
        deliveryAddress: 'Masaki, Dar es Salaam'
      },
      items: [
        { name: 'Sample Item A', quantity: 1, price: 5000 }
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

// WhatsApp Logs
app.get('/api/whatsapp/logs', (req, res) => {
  res.json({
    success: true,
    logs: whatsapp.getLogs(50)
  });
});

// =========================================================================
// ODOO DASHBOARD & SYSTEM APIS
// =========================================================================

// Global Products API
app.get('/api/odoo/products', async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const result = await odoo.fetchOdooProducts(forceRefresh);
    res.json({
      success: true,
      cached: result.cached,
      count: result.products.length,
      categories: result.categories,
      products: result.products
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Dashboard Metrics (Supports Store & Period filtering)
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

// 1-Click Restock in Odoo
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

// System Status
app.get('/api/odoo/status', (req, res) => {
  res.json({
    connected: true,
    host: odoo.ODOO_CONFIG.host,
    db: odoo.ODOO_CONFIG.db,
    user: odoo.ODOO_CONFIG.username,
    totalStores: stores.getAllStores().length,
    whatsappGateway: 'OpenWA Active',
    serverTime: new Date().toISOString()
  });
});

// =========================================================================
// HTML PAGE ROUTES & DYNAMIC STOREFRONT ROUTING
// =========================================================================

// Multi-Client Portal / Store Directory
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'portal.html'));
});

// Super Admin / Multi-Client Dashboard
app.get(['/dashboard', '/dashboard.html', '/admin', '/admin.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Odoo ERP Integration Preview
app.get(['/odoo-preview', '/odoo_preview.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'odoo_preview.html'));
});

// Personalized Client Storefront Routes: achete.me/:shop_slug (e.g. /abcstore, /novamart, /crownshop)
app.get('/:slug', (req, res, next) => {
  const slug = req.params.slug;
  const store = stores.getStoreBySlug(slug);
  if (store) {
    return res.sendFile(path.join(__dirname, 'public', 'storefront.html'));
  }
  // Fallback to static files
  next();
});

// Personalized Cart for Client Store
app.get('/:slug/cart', (req, res, next) => {
  const slug = req.params.slug;
  const store = stores.getStoreBySlug(slug);
  if (store) {
    return res.sendFile(path.join(__dirname, 'public', 'cart.html'));
  }
  next();
});

// Personalized Order Confirmation / Receipt
app.get(['/:slug/confirmation', '/:slug/order/:orderId'], (req, res, next) => {
  const slug = req.params.slug;
  const store = stores.getStoreBySlug(slug);
  if (store) {
    return res.sendFile(path.join(__dirname, 'public', 'confirmation.html'));
  }
  next();
});

// Legacy direct file routes
app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'storefront.html'));
});
app.get('/cart.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cart.html'));
});
app.get('/confirmation.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'confirmation.html'));
});

// Fallback to portal
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'portal.html'));
});

// Start Express Server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🚀 ACHETE.ME Multi-Client Store Platform Running!`);
  console.log(`🌐 Server URL: http://0.0.0.0:${PORT}`);
  console.log(`🏪 Active Stores: ${stores.getActiveStores().map(s => `/${s.slug}`).join(', ')}`);
  console.log(`⚡ OpenWA WhatsApp Gateway: Online (+255712345678)`);
  console.log(`=======================================================`);
});

module.exports = app;
