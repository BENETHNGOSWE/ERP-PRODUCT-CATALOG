/**
 * ODOO MULTI-CLIENT CATALOG & DIRECT WHATSAPP PLATFORM
 * Clean, fast, direct order submission & automated WhatsApp notifications
 */

try { require('dotenv').config(); } catch (e) {}
const express = require('express');
const cors = require('cors');
const path = require('path');
const odoo = require('./odoo');
const stores = require('./stores');
const whatsapp = require('./whatsapp');
const orders = require('./orders');

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

// 5b. Get Store Inventory Management Data (Assigned + Available ERP Products)
app.get('/api/stores/:id/inventory', async (req, res) => {
  try {
    const store = !isNaN(Number(req.params.id)) ? stores.getStoreById(Number(req.params.id)) : stores.getStoreBySlug(req.params.id);
    if (!store) return res.status(404).json({ success: false, error: 'Store not found' });

    const odooResult = await odoo.fetchOdooProducts(false);
    const allProducts = odooResult.products || [];

    const assignedSet = new Set((store.productIds || []).map(Number));
    const storeProducts = stores.filterProductsForStore(allProducts, store);

    res.json({
      success: true,
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug,
        whatsapp: store.whatsapp,
        logo: store.logo,
        productIds: store.productIds || []
      },
      storeProducts: storeProducts,
      allProducts: allProducts.map(p => ({
        ...p,
        isAssigned: assignedSet.has(p.id) || storeProducts.some(sp => sp.id === p.id)
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5c. Assign Selected Products from ERP to a Store
app.post('/api/stores/:id/assign-products', async (req, res) => {
  try {
    const { productIds } = req.body;
    if (!Array.isArray(productIds)) {
      return res.status(400).json({ success: false, error: 'productIds must be an array' });
    }
    const updated = stores.assignProductsToStore(req.params.id, productIds);
    res.json({
      success: true,
      message: `Assigned ${updated.productIds.length} products to "${updated.name}"!`,
      store: updated
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 5d. Quick-Add a Brand New Product Specifically to This Store
app.post('/api/stores/:id/quick-add-product', async (req, res) => {
  try {
    const productData = req.body;
    if (!productData.name) {
      return res.status(400).json({ success: false, error: 'Product name is required' });
    }

    const initialStock = Number(productData.initialStock) || 50;
    const createResult = await odoo.createOdooProduct(productData, initialStock);

    if (createResult.productId) {
      stores.addProductToStore(req.params.id, createResult.productId);
    }

    res.status(201).json({
      success: true,
      message: `Product "${productData.name}" created with ${initialStock} units and assigned to store!`,
      productId: createResult.productId,
      product: createResult.product
    });
  } catch (err) {
    console.error('[Quick Add Product Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5e. Remove a Product from a Store
app.delete('/api/stores/:id/products/:productId', (req, res) => {
  try {
    const updated = stores.removeProductFromStore(req.params.id, req.params.productId);
    res.json({
      success: true,
      message: 'Product unassigned from store.',
      store: updated
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 5f. Bulk Import Products and Stock for a Store
app.post(['/api/stores/:id/import-stock', '/api/:id/import-stock'], async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'No items provided for import' });
    }

    const targetStore = stores.getStoreById(req.params.id) || stores.getStoreBySlug(req.params.id);
    if (!targetStore) return res.status(404).json({ success: false, error: 'Store not found' });

    const addedIds = [];
    for (const item of items) {
      if (item.name) {
        const added = stores.addCustomProductToStore(targetStore.id, {
          name: item.name,
          category: item.category || 'General',
          price: Number(item.price) || 0,
          initialStock: Number(item.stock || item.qty || 0),
          sku: item.sku || item.code || '',
          image: item.image || '/assets/products/samsung_charger.png'
        });
        addedIds.push(added.product.id);
      }
    }

    res.json({
      success: true,
      importedCount: addedIds.length,
      message: `Successfully imported ${addedIds.length} products to store "${targetStore.name}"!`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5g. Client Store Stock Receiving (Add received quantity e.g. +10)
app.post(['/api/:slug/stock/receive', '/api/stores/:slug/stock/receive'], async (req, res) => {
  try {
    const slug = req.params.slug;
    const { productId, addQty, price, name } = req.body;
    if (!productId) return res.status(400).json({ success: false, error: 'Product ID is required' });

    const result = stores.updateStoreProductStock(slug, productId, {
      addQty: Number(addQty) || 0,
      price: price !== undefined ? Number(price) : undefined,
      name
    });

    res.json({
      success: true,
      message: `Successfully received +${addQty} stock units for store!`,
      ...result
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 5h. Client Store Direct Stock & Price Update (Set exact stock/price)
app.post(['/api/:slug/stock/update', '/api/stores/:slug/stock/update'], async (req, res) => {
  try {
    const slug = req.params.slug;
    const { productId, newQty, price, name } = req.body;
    if (!productId) return res.status(400).json({ success: false, error: 'Product ID is required' });

    const result = stores.updateStoreProductStock(slug, productId, {
      newQty: newQty !== undefined ? Number(newQty) : undefined,
      price: price !== undefined ? Number(price) : undefined,
      name
    });

    res.json({
      success: true,
      message: 'Store stock & price updated successfully!',
      ...result
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 5i. Client Store Batch Stock Receive (Multiple items received at once)
app.post(['/api/:slug/stock/batch-receive', '/api/stores/:slug/stock/batch-receive'], async (req, res) => {
  try {
    const slug = req.params.slug;
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'No restock items provided' });
    }

    for (const item of items) {
      if (item.productId) {
        stores.updateStoreProductStock(slug, item.productId, {
          addQty: item.addQty !== undefined ? Number(item.addQty) : undefined,
          newQty: item.newQty !== undefined ? Number(item.newQty) : undefined,
          price: item.price !== undefined ? Number(item.price) : undefined
        });
      }
    }

    res.json({
      success: true,
      message: `Updated stock levels for ${items.length} items in store!`
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 5j. Client Store Create Brand New Custom Product
app.post(['/api/:slug/products/create', '/api/stores/:slug/products/create'], async (req, res) => {
  try {
    const slug = req.params.slug;
    const productData = req.body;
    if (!productData.name) {
      return res.status(400).json({ success: false, error: 'Product name is required' });
    }

    const result = stores.addCustomProductToStore(slug, productData);
    res.status(201).json({
      success: true,
      message: `Product "${productData.name}" created and added to your store!`,
      product: result.product
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
app.post(['/api/odoo/order', '/api/orders', '/api/:slug/order'], async (req, res) => {
  try {
    const orderData = req.body;
    if (!orderData.items || orderData.items.length === 0) {
      return res.status(400).json({ success: false, error: 'Cannot create order: Cart is empty' });
    }

    const slug = req.params.slug || orderData.storeSlug || 'novamart';
    const store = stores.getStoreBySlug(slug) || stores.getAllStores()[0];

    const customerName = (orderData.customer && orderData.customer.name) || orderData.customerName || 'Store Customer';
    const customerPhone = (orderData.customer && orderData.customer.phone) || orderData.customerPhone || store.whatsapp;
    const deliveryAddress = (orderData.customer && (orderData.customer.address || orderData.customer.deliveryAddress)) || orderData.deliveryAddress || store.address || 'Dar es Salaam';

    const calculatedTotal = (orderData.items || []).reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);
    const finalTotal = Number(orderData.totalAmount || orderData.total || calculatedTotal);

    orderData.storeId = store.id;
    orderData.storeSlug = store.slug;
    orderData.storeName = store.name;
    orderData.storeWhatsapp = store.whatsapp;
    orderData.posConfigId = store.posConfigId;
    orderData.customerName = customerName;
    orderData.customerPhone = customerPhone;
    orderData.deliveryAddress = deliveryAddress;
    orderData.totalAmount = finalTotal;

    console.log(`[Order Processing] Store "${store.name}" (${store.slug}) — Total: TZS ${finalTotal}`);

    // 1. Create POS Order in Odoo ERP & Deduct Stock
    let odooOrderResult = { odooOrderId: null, receiptNumber: `Order WEB-${Date.now()}` };
    try {
      odooOrderResult = await odoo.createOdooPosOrder(orderData);
    } catch (odooErr) {
      console.warn('[Odoo POS Order Notice]:', odooErr.message);
      // Fallback stock deduction in memory
      odoo.deductStock(orderData.items).catch(() => {});
    }

    // Deduct stock isolated strictly for this store's inventory
    try {
      stores.deductStoreStock(store.id, orderData.items);
    } catch (deductErr) {
      console.warn('[Store Stock Deduct Warning]:', deductErr.message);
    }

    const finalOrderId = orderData.orderId || `ORD-${Date.now().toString().slice(-4)}`;
    const finalReceipt = odooOrderResult.receiptNumber || `Order WEB-${finalOrderId}`;

    // 2. Automatically Send WhatsApp Order Alert Directly via OpenWA in the Background
    let waResult = null;
    try {
      waResult = await whatsapp.sendOrderNotification(store, {
        orderNumber: finalOrderId,
        receiptNumber: finalReceipt,
        customer: {
          name: customerName,
          phone: customerPhone,
          deliveryAddress: deliveryAddress
        },
        items: orderData.items,
        totalAmount: finalTotal
      });
      console.log(`[WhatsApp Auto-Dispatch] Notification sent directly to ${store.whatsapp}!`);
    } catch (waErr) {
      console.warn('[WhatsApp Gateway Warning]:', waErr.message);
      waResult = { success: false, error: waErr.message };
    }

    // 3. Persist Order in Local Database (data/orders.json)
    const recorded = orders.recordOrder({
      orderId: finalOrderId,
      odooOrderId: odooOrderResult.odooOrderId,
      receiptNumber: finalReceipt,
      storeId: store.id,
      storeSlug: store.slug,
      storeName: store.name,
      storeWhatsapp: store.whatsapp,
      posConfigId: store.posConfigId,
      customerName: customerName,
      customerPhone: customerPhone,
      deliveryAddress: deliveryAddress,
      items: orderData.items,
      subtotal: orderData.subtotal || finalTotal,
      discount: orderData.discount || 0,
      totalAmount: finalTotal,
      whatsappStatus: waResult && waResult.success ? 'Sent' : 'Dispatched',
      waLink: waResult ? waResult.waLink : null
    });

    res.status(201).json({
      success: true,
      message: 'Order created in Odoo and recorded with direct WhatsApp notification!',
      order: {
        id: recorded.id,
        orderId: recorded.orderId,
        odooOrderId: recorded.odooOrderId,
        odooOrderName: recorded.receiptNumber,
        receiptNumber: recorded.receiptNumber,
        storeSlug: recorded.storeSlug,
        storeName: recorded.storeName,
        storeWhatsapp: recorded.storeWhatsapp,
        totalAmount: recorded.totalAmount,
        whatsapp: waResult,
        waLink: waResult ? waResult.waLink : null
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

// 8. Order Tracking & History Endpoints
app.get('/api/orders', (req, res) => {
  try {
    const storeSlug = req.query.store || req.query.slug;
    const list = storeSlug ? orders.getOrdersByStore(storeSlug) : orders.getAllOrders();
    res.json({
      success: true,
      total: list.length,
      orders: list
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/orders/:id', (req, res) => {
  try {
    const order = orders.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Admin Dashboard Metrics (Supports Store & Period filtering)
app.get('/api/odoo/dashboard', async (req, res) => {
  try {
    const dashboardData = await odoo.getOdooDashboardData();
    dashboardData.stores = stores.getAllStores();
    
    // Merge recorded store orders into recent orders list
    const recordedOrders = orders.getAllOrders();
    if (recordedOrders.length > 0) {
      const mappedRecent = recordedOrders.slice(0, 10).map(ro => ({
        id: ro.odooOrderId || ro.id,
        orderNumber: ro.orderId,
        posRef: ro.receiptNumber,
        customerName: ro.customer ? ro.customer.name : 'Web Customer',
        phone: ro.customer ? ro.customer.phone : ro.storeWhatsapp,
        storeName: ro.storeName,
        storeSlug: ro.storeSlug,
        total: ro.totalAmount,
        itemCount: ro.itemCount || (ro.items ? ro.items.length : 1),
        status: ro.status || 'Paid',
        date: ro.dateFormatted || new Date(ro.createdAt).toLocaleDateString()
      }));

      // Combine with existing recent orders, avoiding duplicates
      const existingRefs = new Set(mappedRecent.map(r => r.posRef));
      const filteredOdooRecent = (dashboardData.recentOrders || []).filter(o => !existingRefs.has(o.posRef));
      dashboardData.recentOrders = [...mappedRecent, ...filteredOdooRecent].slice(0, 15);
      
      // Update today KPI count
      if (dashboardData.periods && dashboardData.periods.today) {
        const todayRecorded = recordedOrders.filter(o => {
          const d = new Date(o.createdAt);
          const now = new Date();
          return d.toDateString() === now.toDateString();
        });
        const extraSales = todayRecorded.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
        dashboardData.periods.today.kpi.totalOrders = Math.max(dashboardData.periods.today.kpi.totalOrders, dashboardData.periods.today.kpi.totalOrders + todayRecorded.length);
      }
    }

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

// 10. WhatsApp Gateway Configuration & Live Test Endpoints
app.get('/api/whatsapp/config', (req, res) => {
  res.json({ success: true, config: whatsapp.getConfigSanitized() });
});

app.post('/api/whatsapp/config', (req, res) => {
  try {
    const updated = whatsapp.saveConfig(req.body);
    res.json({
      success: true,
      message: 'WhatsApp Gateway settings saved successfully!',
      config: updated.config
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/whatsapp/test-send', async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }
    const result = await whatsapp.sendTestMessage(phone, message);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/whatsapp/status', async (req, res) => {
  try {
    const store = stores.getAllStores()[0];
    const status = await whatsapp.checkSessionStatus(store);
    res.json({
      success: true,
      status: status,
      logs: whatsapp.getLogs(20)
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

// Store PIN Verification Endpoint
app.post(['/api/stores/:idOrSlug/verify-pin', '/api/:idOrSlug/verify-pin'], (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const { pin, whatsapp } = req.body;
    const store = stores.getStoreBySlug(idOrSlug) || stores.getStoreById(idOrSlug);
    if (!store) return res.status(404).json({ success: false, error: 'Store not found' });

    const expectedPin = store.pin || '1234';
    const cleanWa = String(whatsapp || '').replace(/[^0-9]/g, '');
    const storeWa = String(store.whatsapp || '').replace(/[^0-9]/g, '');

    if (pin && String(pin).trim() === expectedPin) {
      return res.json({ success: true, message: 'PIN verified successfully!', store });
    }
    if (cleanWa && storeWa && (cleanWa.endsWith(storeWa) || storeWa.endsWith(cleanWa))) {
      return res.json({ success: true, message: 'WhatsApp verified successfully!', store });
    }

    return res.status(401).json({ success: false, error: 'Invalid PIN. Default PIN is 1234.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Store-Specific Isolated Dashboard Data
app.get('/api/:slug/dashboard-data', async (req, res) => {
  try {
    const slug = req.params.slug;
    const store = stores.getStoreBySlug(slug);
    if (!store) return res.status(404).json({ success: false, error: 'Store not found' });

    // 1. Get Store Products
    const odooRes = await odoo.fetchOdooProducts();
    const allOdooProducts = (odooRes && odooRes.products) ? odooRes.products : (Array.isArray(odooRes) ? odooRes : []);
    const storeProducts = stores.filterProductsForStore(allOdooProducts, store);

    // 2. Get Store Orders
    const storeOrders = orders.getOrdersByStore(slug);

    // 3. Calculate Period Metrics for this store
    const now = new Date();
    const todayOrders = storeOrders.filter(o => new Date(o.createdAt).toDateString() === now.toDateString());
    const weekOrders = storeOrders.filter(o => (now - new Date(o.createdAt)) <= (7 * 24 * 60 * 60 * 1000));
    const monthOrders = storeOrders.filter(o => (now - new Date(o.createdAt)) <= (30 * 24 * 60 * 60 * 1000));

    const calcSum = (arr) => arr.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

    const outOfStockCount = storeProducts.filter(p => (p.qty_available || 0) <= 0).length;
    const lowStockCount = storeProducts.filter(p => (p.qty_available || 0) > 0 && (p.qty_available || 0) <= 5).length;

    res.json({
      success: true,
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug,
        logo: store.logo,
        whatsapp: store.whatsapp,
        address: store.address,
        status: store.status
      },
      kpi: {
        totalRevenue: calcSum(storeOrders),
        totalOrders: storeOrders.length,
        todaySales: calcSum(todayOrders),
        todayOrders: todayOrders.length,
        weekSales: calcSum(weekOrders),
        weekOrders: weekOrders.length,
        monthSales: calcSum(monthOrders),
        monthOrders: monthOrders.length,
        totalProducts: storeProducts.length,
        outOfStock: outOfStockCount,
        lowStock: lowStockCount
      },
      products: storeProducts,
      orders: storeOrders.slice(0, 50),
      recentOrders: storeOrders.slice(0, 15).map(ro => ({
        id: ro.odooOrderId || ro.id,
        orderNumber: ro.orderId,
        posRef: ro.receiptNumber || `Order ${ro.orderId}`,
        customerName: (ro.customer && ro.customer.name) || 'Store Customer',
        phone: (ro.customer && ro.customer.phone) || ro.storeWhatsapp,
        storeName: ro.storeName,
        storeSlug: ro.storeSlug,
        total: ro.totalAmount,
        itemCount: ro.itemCount || (ro.items ? ro.items.length : 1),
        status: ro.status || 'Paid',
        date: ro.dateFormatted || new Date(ro.createdAt).toLocaleDateString()
      }))
    });
  } catch (err) {
    console.error('Error fetching store dashboard data:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Executive Admin Dashboard (Supports /dashboard, /admin, /:slug/dashboard, /:slug/admin)
app.get(['/dashboard', '/dashboard.html', '/admin', '/admin.html', '/:slug/dashboard', '/:slug/admin'], (req, res) => {
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
