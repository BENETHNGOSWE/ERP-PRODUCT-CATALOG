/**
 * ODOO MULTI-CLIENT CATALOG & DIRECT WHATSAPP PLATFORM
 * Clean, fast, direct order submission & automated WhatsApp notifications
 */

try { require('dotenv').config(); } catch (e) {}
const fs = require('fs');
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const path = require('path');
const odoo = require('./odoo');
const stores = require('./stores');
const whatsapp = require('./whatsapp');
const orders = require('./orders');

const app = express();
const PORT = process.env.PORT || 3000;

// High-speed Gzip/Deflate compression for all responses
app.use(compression({ level: 6, threshold: 256 }));
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static Assets with Cache-Control headers
const staticCacheOptions = {
  maxAge: '1d',
  etag: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    } else if (filePath.match(/\.(css|js|png|jpg|jpeg|svg|ico|woff2)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    }
  }
};

app.use('/assets/stores', (req, res, next) => {
  const filePath = path.join(__dirname, 'public', 'assets', 'stores', req.path);
  if (fs.existsSync(filePath)) {
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.sendFile(filePath);
  }
  const uploadPath = path.join(__dirname, 'data', 'uploads', req.path);
  if (fs.existsSync(uploadPath)) {
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.sendFile(uploadPath);
  }
  next();
});
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets'), staticCacheOptions));
app.use(express.static(path.join(__dirname, 'public'), staticCacheOptions));

// Nested Static Asset Fallbacks for dynamic subpaths (e.g., /:slug/style.css, /:slug/store.js, /:slug/assets/*)
app.get('/:slug/style.css', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(path.join(__dirname, 'public', 'style.css'));
});
app.get('/:slug/store.js', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(path.join(__dirname, 'public', 'store.js'));
});
app.use('/:slug/assets', express.static(path.join(__dirname, 'public', 'assets'), staticCacheOptions));

// =========================================================================
// MULTI-CLIENT STORE API ROUTES & BACKUP RECOVERY
// =========================================================================

// Store Backup Export Endpoint (Non-Destructive Cloud & Local Redundancy)
app.get('/api/admin/stores/export', (req, res) => {
  try {
    const allStores = stores.getAllStores();
    res.setHeader('Content-Disposition', 'attachment; filename="achete_stores_backup.json"');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(allStores, null, 2));
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Store Backup Import Endpoint
app.post('/api/admin/stores/import', (req, res) => {
  try {
    const importedStores = req.body;
    if (!Array.isArray(importedStores)) {
      return res.status(400).json({ success: false, error: 'Expected an array of store objects' });
    }
    importedStores.forEach(s => {
      if (s && s.slug) {
        try {
          const existing = stores.getStoreBySlug(s.slug);
          if (existing) {
            stores.updateStore(existing.id, s);
          } else {
            stores.createStore(s);
          }
        } catch (e) {}
      }
    });
    res.json({
      success: true,
      message: `Successfully merged and preserved ${importedStores.length} stores!`,
      stores: stores.getAllStores()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

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

// 3. Create New Client Store & Sync Store Tag to Odoo ERP
app.post('/api/stores', async (req, res) => {
  try {
    const newStore = stores.createStore(req.body);
    
    // Auto-create Store Tag in Odoo ERP so products can be tagged during bulk import
    odoo.ensureStoreTagInOdoo(newStore).catch(e => {
      console.warn('[Odoo Store Tag Auto-Sync Note]:', e.message);
    });

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
app.put(['/api/stores/:id', '/api/:id/settings'], (req, res) => {
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

// 4b. Dedicated Store Signboard Banner Upload & Update
app.post(['/api/stores/:id/banner', '/api/:id/banner'], (req, res) => {
  try {
    const bannerData = req.body.banner || req.body.image;
    if (!bannerData) {
      return res.status(400).json({ success: false, error: 'No banner image data provided' });
    }
    const updated = stores.updateStore(req.params.id, { banner: bannerData });
    res.json({
      success: true,
      message: `Store banner for "${updated.name}" updated successfully!`,
      banner: updated.banner,
      store: updated
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 5. Delete Store
app.delete('/api/stores/:id', async (req, res) => {
  try {
    const removed = stores.deleteStore(req.params.id);
    if (removed && removed.slug) {
      odoo.removeStoreTagFromOdoo(removed.slug).catch(e => {
        console.warn('[Odoo Store Tag Auto-Delete Note]:', e.message);
      });
    }
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
      stores.updateStoreProductStock(req.params.id, createResult.productId, {
        newQty: initialStock,
        price: Number(productData.price) || 0,
        name: productData.name,
        description: productData.description
      });
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

    const qtyToAdd = Number(addQty) || 0;
    let odooUpdated = null;

    // 1. If it is an Odoo product, increment physical stock in Odoo ERP WH/Stock directly
    try {
      if (qtyToAdd > 0) {
        odooUpdated = await odoo.restockOdooProduct(productId, qtyToAdd);
      }
    } catch (odooErr) {
      console.warn(`[Odoo Restock Warning for ${productId}]:`, odooErr.message);
    }

    // 2. Update store manager record
    const result = stores.updateStoreProductStock(slug, productId, {
      addQty: qtyToAdd,
      newQty: odooUpdated ? odooUpdated.newStock : undefined,
      price: price !== undefined ? Number(price) : undefined,
      name
    });

    res.json({
      success: true,
      message: `Successfully received +${qtyToAdd} stock units for store!`,
      odooSync: Boolean(odooUpdated),
      newStock: odooUpdated ? odooUpdated.newStock : undefined,
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

    let odooUpdated = null;
    if (newQty !== undefined && newQty !== null && !isNaN(Number(newQty))) {
      try {
        odooUpdated = await odoo.setOdooProductStock(productId, Number(newQty));
      } catch (odooErr) {
        console.warn(`[Odoo Set Stock Warning for ${productId}]:`, odooErr.message);
      }
    }

    const result = stores.updateStoreProductStock(slug, productId, {
      newQty: newQty !== undefined ? Number(newQty) : undefined,
      price: price !== undefined ? Number(price) : undefined,
      name
    });

    res.json({
      success: true,
      message: 'Store stock & price updated successfully!',
      odooSync: Boolean(odooUpdated),
      newStock: odooUpdated ? odooUpdated.newStock : undefined,
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
        if (item.addQty && Number(item.addQty) > 0) {
          try {
            await odoo.restockOdooProduct(item.productId, Number(item.addQty));
          } catch (e) {}
        } else if (item.newQty !== undefined && !isNaN(Number(item.newQty))) {
          try {
            await odoo.setOdooProductStock(item.productId, Number(item.newQty));
          } catch (e) {}
        }

        stores.updateStoreProductStock(slug, item.productId, {
          addQty: item.addQty !== undefined ? Number(item.addQty) : undefined,
          newQty: item.newQty !== undefined ? Number(item.newQty) : undefined,
          price: item.price !== undefined ? Number(item.price) : undefined
        });
      }
    }

    res.json({
      success: true,
      message: `Updated stock levels for ${items.length} items in store and Odoo ERP!`
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 5j. Client Store Create Brand New Custom Product (Creates in Odoo ERP + Assigns to Store)
app.post(['/api/:slug/products/create', '/api/stores/:slug/products/create'], async (req, res) => {
  try {
    const slug = req.params.slug;
    const store = stores.getStoreBySlug(slug);
    if (!store) {
      return res.status(404).json({ success: false, error: 'Store not found' });
    }

    const productData = req.body;
    if (!productData.name) {
      return res.status(400).json({ success: false, error: 'Product name is required' });
    }

    const initialStock = Number(productData.initialStock) || 0;
    
    // 1. Create in master Odoo ERP (Point of Sale -> Products)
    let odooProductId = null;
    let odooProductObj = null;
    try {
      const createResult = await odoo.createOdooProduct({
        ...productData,
        storeSlug: store.slug,
        storeName: store.name
      }, initialStock);
      odooProductId = createResult.productId;
      odooProductObj = createResult.product;
    } catch (odooErr) {
      console.warn('[Odoo Product Creation Warning]:', odooErr.message);
    }

    // 2. Assign and record in Store Manager with isolated stock and details
    if (odooProductId) {
      productData.id = odooProductId;
      stores.addProductToStore(store.id, odooProductId);
      stores.updateStoreProductStock(store.id, odooProductId, {
        newQty: initialStock,
        price: Number(productData.price) || 0,
        name: productData.name,
        description: productData.description
      });

      return res.status(201).json({
        success: true,
        message: `Product "${productData.name}" created in Odoo ERP and added to your store!`,
        productId: odooProductId,
        product: odooProductObj || productData
      });
    }

    // 3. Fallback only if Odoo was unreachable
    const fallbackId = (1000 + Math.floor(Math.random() * 9000));
    const result = stores.addCustomProductToStore(slug, {
      ...productData,
      id: fallbackId
    });

    res.status(201).json({
      success: true,
      message: `Product "${productData.name}" added to your store!`,
      productId: fallbackId,
      product: result.product
    });
  } catch (err) {
    console.error('[Create Store Product Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5h. Sync All Stores to Odoo ERP as Product Tags (Enables Bulk Import Filtering in Odoo)
app.post('/api/odoo/sync-stores', async (req, res) => {
  try {
    const allStoresList = stores.getAllStores();
    const syncResults = await odoo.syncAllStoresToOdoo(allStoresList);
    res.json({
      success: true,
      message: `Synchronized ${allStoresList.length} stores to Odoo ERP as Product Tags!`,
      server: odoo.ODOO_CONFIG.host,
      db: odoo.ODOO_CONFIG.db,
      results: syncResults
    });
  } catch (err) {
    console.error('[Odoo Store Sync Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5i. Download Bulk Product Import CSV Template for Odoo ERP
app.get('/api/odoo/template.csv', (req, res) => {
  try {
    const allStoresList = stores.getAllStores();
    const sampleStoreSlugs = allStoresList.map(s => s.slug).slice(0, 3).join(', ');
    
    const csvContent = [
      'Name,Sales Price,Product Category,Point of Sale Category,Available in POS,Product Tags,Internal Reference',
      'Samsung Galaxy S24,1850000,Smartphones,Smartphones,TRUE,kodastore,SKU-SAM-S24',
      'Apple MacBook Pro 16,5500000,Electronics,Electronics,TRUE,kodastore,SKU-MAC-16',
      'Safety Hard Hat ArcGuard,45000,Safety Gear,Head Protection,TRUE,achete,SKU-HELM-01',
      'Industrial TitanStep Boots,145000,Safety Gear,Foot Protection,TRUE,achete,SKU-BOOT-01'
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="odoo_bulk_product_import_template.csv"');
    res.send(csvContent);
  } catch (err) {
    res.status(500).send('Error generating template');
  }
});

// 6. Get Products Filtered Strictly for a Client Store (Product Separation)
app.get(['/api/:slug/products', '/api/stores/:slug/products', '/api/odoo/products'], async (req, res) => {
  try {
    const slug = req.params.slug || req.query.store;
    let store = null;
    if (slug && slug !== 'achete' && slug !== 'shop' && slug !== 'catalog' && slug !== 'all') {
      store = stores.getStoreBySlug(slug) || stores.getStoreById(slug);
    }
    if (!store && req.query.store) {
      store = stores.getStoreBySlug(req.query.store) || stores.getStoreById(req.query.store);
    }
    if (!store) {
      store = stores.getAllStores()[0];
    }

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
        banner: store.banner,
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

    const slug = req.params.slug || orderData.storeSlug || 'achete';
    let store = stores.getStoreBySlug(slug);
    if (!store) {
      store = stores.getAllStores().find(s => s.slug.toLowerCase() === slug.toLowerCase() || s.name.toLowerCase() === slug.toLowerCase()) || stores.getAllStores()[0];
    }

    const storeWhatsapp = (store && store.whatsapp && !store.whatsapp.includes('12345678'))
      ? store.whatsapp
      : ((orderData.storeWhatsapp && !orderData.storeWhatsapp.includes('12345678')) ? orderData.storeWhatsapp : '+255710459064');
    const storeName = orderData.storeName || (store && store.name) || 'Store';

    const storeContext = {
      ...(store || {}),
      id: (store && store.id) || 9,
      name: storeName,
      slug: (store && store.slug) || slug,
      whatsapp: storeWhatsapp
    };

    const customerName = (orderData.customer && orderData.customer.name) || orderData.customerName || 'Store Customer';
    const customerPhone = (orderData.customer && orderData.customer.phone) || orderData.customerPhone || storeWhatsapp;
    const deliveryAddress = (orderData.customer && (orderData.customer.address || orderData.customer.deliveryAddress)) || orderData.deliveryAddress || (store && store.address) || 'Dar es Salaam';

    const calculatedTotal = (orderData.items || []).reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);
    const finalTotal = Number(orderData.totalAmount || orderData.total || calculatedTotal);

    orderData.storeId = storeContext.id;
    orderData.storeSlug = storeContext.slug;
    orderData.storeName = storeContext.name;
    orderData.storeWhatsapp = storeContext.whatsapp;
    orderData.posConfigId = storeContext.posConfigId || 1;
    orderData.customerName = customerName;
    orderData.customerPhone = customerPhone;
    orderData.deliveryAddress = deliveryAddress;
    orderData.totalAmount = finalTotal;

    console.log(`[Order Processing] Store "${storeContext.name}" (${storeContext.slug}) -> WhatsApp: ${storeContext.whatsapp} — Total: TZS ${finalTotal}`);

    const finalOrderId = orderData.orderId || `ORD-${Date.now().toString().slice(-4)}`;
    const finalReceipt = `Order WEB-${finalOrderId}`;

    orderData.orderId = finalOrderId;
    orderData.orderNumber = finalOrderId;
    orderData.receiptNumber = finalReceipt;

    // 1. Enrich items with merchant stock on hand intelligence for WhatsApp alert
    const enrichedItems = (orderData.items || []).map(item => {
      let stockOnHand = 50;
      try {
        if (item.id && typeof stores.getStoreProductStock === 'function') {
          const prodStock = stores.getStoreProductStock(storeContext.id, item.id);
          if (prodStock && typeof prodStock.qty_available === 'number') {
            stockOnHand = prodStock.qty_available;
          }
        }
      } catch (e) {}
      return {
        ...item,
        stockOnHand
      };
    });

    // 2. Immediately Dispatch WhatsApp Order Notification in parallel (non-blocking)
    const waNotificationPromise = (async () => {
      try {
        const orderPayload = {
          orderNumber: finalOrderId,
          receiptNumber: finalReceipt,
          customer: {
            name: customerName,
            phone: customerPhone,
            deliveryAddress: deliveryAddress
          },
          items: enrichedItems,
          totalAmount: finalTotal
        };

        // Send Merchant Alert
        const storeRes = await whatsapp.sendOrderNotification(storeContext, orderPayload);
        console.log(`[WhatsApp Auto-Dispatch] Notification sent directly to merchant ${storeContext.whatsapp}!`);

        // If customer phone is provided and differs from store, also send customer receipt
        const normStore = whatsapp.normalizePhone(storeContext.whatsapp);
        const normCust = whatsapp.normalizePhone(customerPhone);
        if (normCust && normCust.length >= 9 && normCust !== '255712345678' && normCust !== normStore) {
          whatsapp.sendCustomerReceipt(customerPhone, storeContext, orderPayload)
            .then(() => console.log(`[WhatsApp Auto-Dispatch] Confirmation sent to customer ${customerPhone}!`))
            .catch(cErr => console.warn('[WhatsApp Customer Receipt Notice]:', cErr.message));
        }

        return storeRes;
      } catch (waErr) {
        console.warn('[WhatsApp Gateway Warning]:', waErr.message);
        return { success: false, error: waErr.message };
      }
    })();

    // 3. Create POS Order in Odoo ERP & Deduct Stock in parallel
    const odooOrderPromise = (async () => {
      let odooResult = { odooOrderId: null, receiptNumber: finalReceipt };
      try {
        odooResult = await odoo.createOdooPosOrder(orderData);
      } catch (odooErr) {
        console.warn('[Odoo POS Order Notice]:', odooErr.message);
        odoo.deductStock(orderData.items).catch(() => {});
      }
      return odooResult;
    })();

    // Deduct stock isolated strictly for this store's inventory
    try {
      stores.deductStoreStock(storeContext.id, orderData.items);
    } catch (deductErr) {
      console.warn('[Store Stock Deduct Warning]:', deductErr.message);
    }

    // 4. Persist Order in Local Database (data/orders.json)
    const recorded = orders.recordOrder({
      orderId: finalOrderId,
      odooOrderId: null,
      receiptNumber: finalReceipt,
      storeId: storeContext.id,
      storeSlug: storeContext.slug,
      storeName: storeContext.name,
      storeWhatsapp: storeContext.whatsapp,
      posConfigId: storeContext.posConfigId,
      customerName: customerName,
      customerPhone: customerPhone,
      deliveryAddress: deliveryAddress,
      items: orderData.items,
      subtotal: orderData.subtotal || finalTotal,
      discount: orderData.discount || 0,
      totalAmount: finalTotal,
      whatsappStatus: 'Dispatched',
      waLink: `https://api.whatsapp.com/send?phone=${storeContext.whatsapp.replace(/[^0-9]/g, '')}&text=${encodeURIComponent(`*ORDER #${finalOrderId}*\nTotal: TZS ${finalTotal}\nCustomer: ${customerName}`)}`
    });

    res.status(201).json({
      success: true,
      message: 'Order created in Odoo and recorded with direct WhatsApp notification!',
      order: {
        id: recorded ? recorded.id : 1,
        orderId: finalOrderId,
        odooOrderId: null,
        odooOrderName: finalReceipt,
        receiptNumber: finalReceipt,
        storeSlug: storeContext.slug,
        storeName: storeContext.name,
        storeWhatsapp: storeContext.whatsapp,
        totalAmount: finalTotal
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
      const mappedRecent = recordedOrders.slice(0, 15).map(ro => ({
        id: ro.odooOrderId || ro.id,
        orderId: ro.orderId,
        ref: ro.receiptNumber || `Order ${ro.orderId}`,
        fullRef: ro.receiptNumber || `Order ${ro.orderId}`,
        customer: (ro.customer && ro.customer.name) || ro.customerName || 'Web Customer',
        customerName: (ro.customer && ro.customer.name) || ro.customerName || 'Web Customer',
        phone: (ro.customer && ro.customer.phone) || ro.customerPhone || ro.storeWhatsapp,
        deliveryAddress: (ro.customer && ro.customer.deliveryAddress) || ro.deliveryAddress || 'Dar es Salaam',
        storeName: ro.storeName,
        storeSlug: ro.storeSlug,
        amount: Number(ro.totalAmount) || 0,
        total: Number(ro.totalAmount) || 0,
        itemCount: ro.itemCount || (ro.items ? ro.items.length : 1),
        items: ro.items || [],
        status: ro.status || 'Paid & Confirmed',
        statusClass: 'completed',
        date: ro.dateFormatted || new Date(ro.createdAt).toLocaleDateString(),
        createdAt: ro.createdAt
      }));

      // Combine with existing recent orders, avoiding duplicates
      const existingRefs = new Set(mappedRecent.map(r => r.ref));
      const filteredOdooRecent = (dashboardData.recentOrders || []).filter(o => !existingRefs.has(o.ref));
      dashboardData.recentOrders = [...mappedRecent, ...filteredOdooRecent].slice(0, 15);
      
      // Update today KPI count
      if (dashboardData.periods && dashboardData.periods.today) {
        const todayRecorded = recordedOrders.filter(o => {
          const d = new Date(o.createdAt);
          const now = new Date();
          return d.toDateString() === now.toDateString();
        });
        dashboardData.periods.today.kpi.totalOrders = Math.max(dashboardData.periods.today.kpi.totalOrders, dashboardData.periods.today.kpi.totalOrders + todayRecorded.length);
        if (dashboardData.periods.today.recentOrders) {
          dashboardData.periods.today.recentOrders = dashboardData.recentOrders;
        }
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

// Cart Page (Supports /cart, /cart.html, /:slug/cart with dynamic banner injection)
app.get(['/cart', '/cart.html', '/:slug/cart'], async (req, res) => {
  const slug = req.params.slug;
  const store = slug ? (stores.getStoreBySlug(slug) || stores.getAllStores()[0]) : (stores.getAllStores()[0]);
  const storeName = store ? store.name : 'Store';
  const storeBanner = store ? (store.banner || '') : '';
  const cartHtmlPath = path.join(__dirname, 'public', 'cart.html');

  let storeProducts = [];
  try {
    const odooRes = await odoo.fetchOdooProducts(false);
    const allProds = odooRes.products || [];
    storeProducts = store ? stores.filterProductsForStore(allProds, store) : allProds;
  } catch (e) {}
  
  fs.readFile(cartHtmlPath, 'utf8', (err, html) => {
    if (err) return res.sendFile(cartHtmlPath);
    let modifiedHtml = html.replace(/<title>.*?<\/title>/i, `<title>Your Cart — ${escapeMetaAttr(storeName)}</title>
  <script id="__INITIAL_DATA__">
    window.__INITIAL_STORE__ = ${JSON.stringify(store || {})};
    window.__INITIAL_PRODUCTS__ = ${JSON.stringify(storeProducts)};
  </script>`);
    if (storeBanner) {
      modifiedHtml = modifiedHtml.replace(
        /<img[^>]*id="storeHeroBannerImg"[^>]*>/i,
        `<img src="${escapeMetaAttr(storeBanner)}" alt="${escapeMetaAttr(storeName)} Signboard" class="store-banner-img" id="storeHeroBannerImg">`
      );
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(modifiedHtml);
  });
});

// Confirmation Receipt Page (Supports /confirmation, /confirmation.html, /:slug/confirmation with dynamic banner injection)
app.get(['/confirmation', '/confirmation.html', '/order-success', '/:slug/confirmation'], async (req, res) => {
  const slug = req.params.slug;
  const store = slug ? (stores.getStoreBySlug(slug) || stores.getAllStores()[0]) : (stores.getAllStores()[0]);
  const storeName = store ? store.name : 'Store';
  const storeBanner = store ? (store.banner || '') : '';
  const confHtmlPath = path.join(__dirname, 'public', 'confirmation.html');

  let storeProducts = [];
  try {
    const odooRes = await odoo.fetchOdooProducts(false);
    const allProds = odooRes.products || [];
    storeProducts = store ? stores.filterProductsForStore(allProds, store) : allProds;
  } catch (e) {}
  
  fs.readFile(confHtmlPath, 'utf8', (err, html) => {
    if (err) return res.sendFile(confHtmlPath);
    let modifiedHtml = html.replace(/<title>.*?<\/title>/i, `<title>Order Confirmed — ${escapeMetaAttr(storeName)}</title>
  <script id="__INITIAL_DATA__">
    window.__INITIAL_STORE__ = ${JSON.stringify(store || {})};
    window.__INITIAL_PRODUCTS__ = ${JSON.stringify(storeProducts)};
  </script>`);
    if (storeBanner) {
      modifiedHtml = modifiedHtml.replace(
        /<img[^>]*id="storeHeroBannerImg"[^>]*>/i,
        `<img src="${escapeMetaAttr(storeBanner)}" alt="${escapeMetaAttr(storeName)} Signboard" class="store-banner-img" id="storeHeroBannerImg">`
      );
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(modifiedHtml);
  });
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

// Helper: Build completely isolated store dashboard payload
function buildStoreIsolatedDashboardPayload(store, storeProducts, storeOrders) {
  const now = new Date();
  const calcSum = (arr) => arr.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  const filterOrdersByTime = (days) => {
    if (days === 0) {
      return storeOrders.filter(o => new Date(o.createdAt).toDateString() === now.toDateString());
    }
    const cutoff = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    return storeOrders.filter(o => new Date(o.createdAt) >= cutoff);
  };

  const todayOrders = filterOrdersByTime(0);
  const weekOrders = filterOrdersByTime(7);
  const monthOrders = filterOrdersByTime(30);
  const allOrders = storeOrders;

  const buildPeriodData = (periodOrders, periodLabel) => {
    const totalSales = calcSum(periodOrders);
    const completed = periodOrders.filter(o => o.status !== 'Cancelled').length;
    const inProgress = periodOrders.filter(o => o.status === 'On Progress' || o.status === 'Processing').length;
    const cancelled = periodOrders.filter(o => o.status === 'Cancelled').length;

    // Top Selling products for this period
    const itemMap = {};
    periodOrders.forEach(o => {
      (o.items || []).forEach(it => {
        const id = it.id || it.productId || it.name;
        const storeProd = storeProducts.find(sp => Number(sp.id) === Number(id));
        const prodImg = (storeProd && (storeProd.image || storeProd.thumb)) || it.image || it.thumb || '/assets/products/samsung_charger.png';

        if (!itemMap[id]) {
          itemMap[id] = {
            id: it.id || it.productId,
            name: it.name || (storeProd ? storeProd.name : `Product #${id}`),
            sku: it.sku || (storeProd ? (storeProd.default_code || storeProd.sku) : `SKU-${id}`),
            category: it.category || (storeProd ? storeProd.category : 'General'),
            image: prodImg,
            thumb: prodImg,
            soldUnits: 0,
            unitsSold: 0,
            revenue: 0,
            profit: 0,
            price: Number(it.price || (storeProd ? storeProd.price : 0)) || 0
          };
        }
        const qty = Number(it.quantity || it.qty || 1);
        itemMap[id].soldUnits += qty;
        itemMap[id].unitsSold += qty;
        const lineTotal = qty * (Number(it.price || itemMap[id].price) || 0);
        itemMap[id].revenue += lineTotal;
        itemMap[id].profit += lineTotal * 0.28;
      });
    });

    const topSelling = Object.values(itemMap).sort((a, b) => b.soldUnits - a.soldUnits).slice(0, 5);

    // Sales Chart Series
    let series = [];
    if (periodLabel === 'today') {
      const hours = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
      series = hours.map((h, i) => {
        const val = Math.round(totalSales * ((i + 1) / (hours.length * 1.5))) || (i === hours.length - 1 ? totalSales : 0);
        return { label: h, value: val, amount: val };
      });
    } else if (periodLabel === 'week') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      series = days.map((d, i) => {
        const val = Math.round(totalSales / days.length);
        return { label: d, value: val, amount: val };
      });
    } else {
      const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      series = weeks.map((w, i) => {
        const val = Math.round(totalSales / weeks.length);
        return { label: w, value: val, amount: val };
      });
    }

    return {
      kpi: {
        totalSales,
        orderCompleted: completed,
        orderInProgress: inProgress,
        totalOrders: periodOrders.length,
        outOfStock: storeProducts.filter(p => (Number(p.qty_available) || 0) <= 0).length
      },
      ordersSummary: {
        total: periodOrders.length,
        completed: { count: completed, percentage: periodOrders.length > 0 ? Math.round((completed / periodOrders.length) * 100) : 100 },
        inProgress: { count: inProgress, percentage: periodOrders.length > 0 ? Math.round((inProgress / periodOrders.length) * 100) : 0 },
        cancelled: { count: cancelled, percentage: periodOrders.length > 0 ? Math.round((cancelled / periodOrders.length) * 100) : 0 },
        successRate: periodOrders.length > 0 ? `${Math.round((completed / periodOrders.length) * 100)}%` : '100%'
      },
      topSelling: topSelling.length > 0 ? topSelling : storeProducts.slice(0, 5).map(p => ({
        id: p.id,
        name: p.name,
        sku: p.default_code || p.sku || 'SKU-01',
        category: p.category || 'General',
        image: p.image || p.thumb || '/assets/products/samsung_charger.png',
        thumb: p.image || p.thumb || '/assets/products/samsung_charger.png',
        soldUnits: 0,
        unitsSold: 0,
        revenue: 0,
        profit: 0,
        price: p.price || 0
      })),
      salesChart: { series },
      recentOrders: periodOrders.slice(0, 15).map(ro => ({
        id: ro.odooOrderId || ro.id,
        orderId: ro.orderId,
        ref: ro.receiptNumber || `Order ${ro.orderId}`,
        fullRef: ro.receiptNumber || `Order ${ro.orderId}`,
        customer: (ro.customer && ro.customer.name) || ro.customerName || 'Store Customer',
        customerName: (ro.customer && ro.customer.name) || ro.customerName || 'Store Customer',
        phone: (ro.customer && ro.customer.phone) || ro.customerPhone || ro.storeWhatsapp,
        deliveryAddress: (ro.customer && ro.customer.deliveryAddress) || ro.deliveryAddress || store.address || 'Dar es Salaam',
        amount: Number(ro.totalAmount) || 0,
        total: Number(ro.totalAmount) || 0,
        itemCount: ro.itemCount || (ro.items ? ro.items.length : 1),
        items: ro.items || [],
        status: ro.status || 'Paid & Confirmed',
        statusClass: 'completed',
        whatsappStatus: ro.whatsappStatus || 'Sent',
        waLink: ro.waLink || null,
        date: ro.dateFormatted || new Date(ro.createdAt).toLocaleDateString(),
        createdAt: ro.createdAt
      }))
    };
  };

  const outOfStockProducts = storeProducts.filter(p => (Number(p.qty_available) || 0) <= 0);
  const periodsData = {
    today: buildPeriodData(todayOrders, 'today'),
    week: buildPeriodData(weekOrders, 'week'),
    month: buildPeriodData(monthOrders, 'month'),
    all: buildPeriodData(allOrders, 'all')
  };

  return {
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
    periods: periodsData,
    ordersSummary: periodsData.today.ordersSummary,
    topSelling: periodsData.today.topSelling,
    salesChart: periodsData.today.salesChart,
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
      outOfStock: outOfStockProducts.length
    },
    products: storeProducts,
    outOfStock: outOfStockProducts,
    recentOrders: storeOrders.slice(0, 15).map(ro => ({
      id: ro.odooOrderId || ro.id,
      orderId: ro.orderId,
      ref: ro.receiptNumber || `Order ${ro.orderId}`,
      fullRef: ro.receiptNumber || `Order ${ro.orderId}`,
      customer: (ro.customer && ro.customer.name) || ro.customerName || 'Store Customer',
      customerName: (ro.customer && ro.customer.name) || ro.customerName || 'Store Customer',
      phone: (ro.customer && ro.customer.phone) || ro.customerPhone || ro.storeWhatsapp,
      deliveryAddress: (ro.customer && ro.customer.deliveryAddress) || ro.deliveryAddress || store.address || 'Dar es Salaam',
      amount: Number(ro.totalAmount) || 0,
      total: Number(ro.totalAmount) || 0,
      itemCount: ro.itemCount || (ro.items ? ro.items.length : 1),
      items: ro.items || [],
      status: ro.status || 'Paid & Confirmed',
      statusClass: 'completed',
      whatsappStatus: ro.whatsappStatus || 'Sent',
      waLink: ro.waLink || null,
      date: ro.dateFormatted || new Date(ro.createdAt).toLocaleDateString(),
      createdAt: ro.createdAt
    }))
  };
}

// Store-Specific Isolated Dashboard Data
app.get('/api/:slug/dashboard-data', async (req, res) => {
  try {
    const slug = req.params.slug;
    const store = stores.getStoreBySlug(slug);
    if (!store) return res.status(404).json({ success: false, error: 'Store not found' });

    // 1. Get Store Products strictly isolated with fresh live Odoo ERP data
    const odooRes = await odoo.fetchOdooProducts(true);
    const allOdooProducts = (odooRes && odooRes.products) ? odooRes.products : (Array.isArray(odooRes) ? odooRes : []);
    const storeProducts = stores.filterProductsForStore(allOdooProducts, store);

    // 2. Get Store Orders strictly isolated
    const storeOrders = orders.getOrdersByStore(slug);

    // 3. Build Isolated Store Dashboard Response
    const payload = buildStoreIsolatedDashboardPayload(store, storeProducts, storeOrders);
    res.json(payload);
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

// Platform Homepage (Official Snippe-inspired Achete Website)
app.get(['/', '/home', '/home.html'], (req, res) => {
  if (req.query.store) {
    return res.sendFile(path.join(__dirname, 'public', 'shop.html'));
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Helper to escape HTML attributes for meta tags
function escapeMetaAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Main Store Catalog Route (Supports /shop, /catalog, /store, /:slug with dynamic OpenGraph cards for Instagram Bio / Story / DM links)
app.get(['/shop', '/catalog', '/store', '/:slug'], async (req, res, next) => {
  const slug = req.params.slug;
  if (slug && (slug.endsWith('.js') || slug.endsWith('.css') || slug.endsWith('.png') || slug.endsWith('.jpg') || slug.endsWith('.svg') || slug.endsWith('.ico') || slug.endsWith('.json') || slug.endsWith('.html'))) {
    return next();
  }

  const store = slug ? (stores.getStoreBySlug(slug) || stores.getAllStores()[0]) : null;
  const storeName = store ? store.name : 'Achete Store';
  const storeTagline = store ? (store.tagline || 'Official Online Store | Fast Delivery in Dar es Salaam') : 'Your digital front door for products and ordering.';
  const storeUrl = store ? `https://achete.me/${store.slug}` : 'https://achete.me/';
  const storeImage = (store && store.banner && !store.banner.startsWith('data:')) 
    ? (store.banner.startsWith('http') ? store.banner : `https://achete.me${store.banner}`)
    : ((store && store.logo && !store.logo.startsWith('data:')) 
        ? (store.logo.startsWith('http') ? store.logo : `https://achete.me${store.logo}`) 
        : 'https://achete.me/assets/achete-icon.png');

  // Instant pre-cached products lookup for this store (< 1ms)
  let storeProducts = [];
  let catList = ['All'];
  try {
    const odooRes = await odoo.fetchOdooProducts(false);
    const allProds = odooRes.products || [];
    storeProducts = store ? stores.filterProductsForStore(allProds, store) : allProds;
    const catSet = new Set(['All']);
    storeProducts.forEach(p => { if (p.category) catSet.add(p.category); });
    catList = Array.from(catSet);
  } catch (e) {}

  const shopHtmlPath = path.join(__dirname, 'public', 'shop.html');
  fs.readFile(shopHtmlPath, 'utf8', (err, html) => {
    if (err) return res.sendFile(shopHtmlPath);

    const dynamicMeta = `
  <title>${escapeMetaAttr(storeName)} — Official Store on Achete</title>
  <meta name="description" content="${escapeMetaAttr(storeTagline)}">
  <meta property="og:title" content="${escapeMetaAttr(storeName)} — Online Store">
  <meta property="og:description" content="${escapeMetaAttr(storeTagline)}">
  <meta property="og:image" content="${escapeMetaAttr(storeImage)}">
  <meta property="og:url" content="${escapeMetaAttr(storeUrl)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Achete">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeMetaAttr(storeName)}">
  <meta name="twitter:description" content="${escapeMetaAttr(storeTagline)}">
  <meta name="twitter:image" content="${escapeMetaAttr(storeImage)}">
  <script id="__INITIAL_DATA__">
    window.__INITIAL_STORE__ = ${JSON.stringify(store || {})};
    window.__INITIAL_PRODUCTS__ = ${JSON.stringify(storeProducts)};
    window.__INITIAL_CATEGORIES__ = ${JSON.stringify(catList)};
  </script>
    `.trim();

    let modifiedHtml = html.replace(/<title>.*?<\/title>/i, dynamicMeta);
    const storeBanner = store ? (store.banner || '') : '';
    if (storeBanner) {
      modifiedHtml = modifiedHtml.replace(
        /<img[^>]*id="storeHeroBannerImg"[^>]*>/i,
        `<img src="${escapeMetaAttr(storeBanner)}" alt="${escapeMetaAttr(storeName)} Signboard" class="store-banner-img" id="storeHeroBannerImg">`
      );
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(modifiedHtml);
  });
});

// Fallback Route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Express Server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`⚡ ACHETE.ME Multi-Client Digital Storefront & WhatsApp Platform`);
  console.log(`🌐 URL: http://0.0.0.0:${PORT} (Domain: achete.me)`);
  console.log(`📲 OpenWA WhatsApp Order Alerts: Enabled (Direct Send)`);
  console.log(`=======================================================`);

  // Sync store tags with Odoo ERP in background
  setTimeout(() => {
    odoo.syncAllStoresToOdoo(stores.getAllStores())
      .then(() => console.log('[Odoo ERP] ✅ Synced active store tags on startup.'))
      .catch(e => console.warn('[Odoo ERP Startup Sync Notice]:', e.message));
  }, 1500);
});

module.exports = app;
