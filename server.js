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

// =========================================================================
// API ROUTES
// =========================================================================

// 1. Get Stores List
app.get('/api/stores', (req, res) => {
  try {
    const allStores = stores.getAllStores();
    res.json({
      success: true,
      total: allStores.length,
      stores: allStores
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Get Products for a Store (or default global)
app.get(['/api/:slug/products', '/api/stores/:slug/products', '/api/odoo/products'], async (req, res) => {
  try {
    const slug = req.params.slug || req.query.store || 'novamart';
    const store = stores.getStoreBySlug(slug) || stores.getAllStores()[0];

    const forceRefresh = req.query.refresh === 'true' || req.query.force === 'true';
    const odooResult = await odoo.fetchOdooProducts(forceRefresh);
    const allProducts = odooResult.products || [];

    // Filter products strictly for this store
    const storeProducts = stores.filterProductsForStore(allProducts, store);

    // Extract unique categories available for this store
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
    console.error(`[Products Fetch Error]:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Place Order in Odoo POS & Automatically Dispatch Direct WhatsApp Message
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

    console.log(`[Order Placement] Processing Order #${orderData.orderId || orderData.orderNumber} for Store "${store.name}" (${store.slug})...`);

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

// 4. Admin Dashboard Metrics
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

// 5. WhatsApp Status
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

// =========================================================================
// CLEAN PAGE ROUTES (EXACT SAME AS CATALOG.KODATECHNOLOGIES.CO.TZ)
// =========================================================================

// Catalog Page (Main / Storefront)
app.get(['/', '/index.html', '/shop', '/:slug'], (req, res, next) => {
  const slug = req.params.slug;
  if (slug && (slug === 'cart' || slug === 'cart.html' || slug === 'confirmation' || slug === 'confirmation.html' || slug === 'dashboard' || slug === 'dashboard.html' || slug === 'odoo-preview')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Cart Page
app.get(['/cart', '/cart.html', '/:slug/cart'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cart.html'));
});

// Confirmation Receipt Page
app.get(['/confirmation', '/confirmation.html', '/order-success', '/:slug/confirmation'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'confirmation.html'));
});

// Dashboard
app.get(['/dashboard', '/dashboard.html', '/admin'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Odoo ERP Integration Preview
app.get(['/odoo-preview', '/odoo_preview.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'odoo_preview.html'));
});

// Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Express Server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`⚡ Clean Catalog & WhatsApp Store Server Running!`);
  console.log(`🌐 URL: http://0.0.0.0:${PORT}`);
  console.log(`📲 OpenWA WhatsApp Order Alerts: Enabled (Direct Send)`);
  console.log(`=======================================================`);
});

module.exports = app;
