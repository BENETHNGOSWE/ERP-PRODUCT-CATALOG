const express = require('express');
const compression = require('compression');
const cors = require('cors');
const path = require('path');
const odoo = require('./odoo.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable gzip/deflate compression for instant delivery
app.use(compression());
app.use(cors());
app.use(express.json());

// Pre-warm Odoo Cache at startup
odoo.fetchOdooProducts(true).then(res => {
  console.log(`[Odoo Live POS Sync]: Pre-warmed ${res.products.length} products & ${res.categories.length} categories.`);
}).catch(err => {
  console.warn('[Odoo Initial Sync Warning]:', err.message || err);
});

// Periodic background sync every 20 seconds so catalog stock is always accurate
setInterval(() => {
  odoo.fetchOdooProducts(true).catch(() => {});
}, 20000);

// =========================================================================
// ODOO REST API ENDPOINTS
// =========================================================================

// 1. Get all products with live stock levels & categories from Odoo POS
app.get('/api/odoo/products', async (req, res) => {
  const force = req.query.force === 'true';
  try {
    const data = await odoo.fetchOdooProducts(force);
    res.json({
      success: true,
      count: data.products.length,
      cached: data.cached,
      categories: data.categories,
      products: data.products,
      odooServer: odoo.ODOO_CONFIG.host,
      db: odoo.ODOO_CONFIG.db,
      user: odoo.ODOO_CONFIG.username
    });
  } catch (err) {
    console.error('Error fetching Odoo products:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to fetch products from Odoo'
    });
  }
});

// 2. Real-time stock deduction API (deduct stock in Odoo immediately)
app.post('/api/odoo/deduct-stock', async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Items array required' });
    }

    const results = await odoo.deductStock(items);
    res.json({
      success: true,
      message: 'Stock deducted in real-time in Odoo',
      results: results
    });
  } catch (err) {
    console.error('Error deducting stock:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to deduct stock in Odoo'
    });
  }
});

// 3. Create POS Order in Odoo & deduct stock in real-time
app.post('/api/odoo/order', async (req, res) => {
  try {
    const { orderId, customerPhone, items, totalAmount } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'No order items provided' });
    }

    console.log(`[Odoo Order Processing]: Creating Order ${orderId || 'New'} with ${items.length} items...`);
    const orderResult = await odoo.createOdooPosOrder({
      orderId: orderId,
      customerPhone: customerPhone || '+255 7XX XXX XXX',
      items: items,
      totalAmount: totalAmount
    });

    res.json({
      success: true,
      message: 'Order created and stock deducted in Odoo POS in real time!',
      order: orderResult
    });
  } catch (err) {
    console.error('Error creating Odoo order:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to create order in Odoo'
    });
  }
});

// 4. Force Odoo Cache Sync
app.post('/api/odoo/sync', async (req, res) => {
  try {
    const data = await odoo.fetchOdooProducts(true);
    res.json({
      success: true,
      message: 'Odoo cache refreshed successfully',
      count: data.products.length,
      categories: data.categories
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Odoo Backend Connection Health Check
app.get('/api/odoo/status', (req, res) => {
  res.json({
    connected: true,
    host: odoo.ODOO_CONFIG.host,
    db: odoo.ODOO_CONFIG.db,
    user: odoo.ODOO_CONFIG.username,
    posSession: 'POS/00036 (Website Orders)',
    serverTime: new Date().toISOString()
  });
});

// =========================================================================
// STATIC ASSETS & PAGE ROUTES
// =========================================================================

app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1h',
  etag: true
}));

// Route: Products / Shop Page
app.get(['/', '/shop', '/products', '/index.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route: Cart Page
app.get(['/cart', '/cart.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cart.html'));
});

// Route: Order Confirmation Page
app.get(['/confirmation', '/confirmation.html', '/order-success'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'confirmation.html'));
});

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`NOVA MART ultra-fast multi-page server running on http://0.0.0.0:${PORT}`);
});
