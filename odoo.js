/**
 * ODOO 18 POS INTEGRATION MODULE
 * Host: postest.kodatechnologies.co.tz
 * DB: KODADEMOS
 * User: developerbeneth@gmail.com
 */

const xmlrpc = require('xmlrpc');

const ODOO_CONFIG = {
  host: 'postest.kodatechnologies.co.tz',
  port: 443,
  db: 'KODADEMOS',
  username: 'developerbeneth@gmail.com',
  password: 'POSIntergration@2026'
};

// In-memory cache for sub-millisecond response times
let cachedProducts = [];
let cachedCategories = [];
let lastFetchTime = 0;
const CACHE_TTL = 10000; // 10 seconds TTL
let authUid = null;
let isSyncing = false;

// Create XML-RPC Clients
const commonClient = xmlrpc.createSecureClient({
  host: ODOO_CONFIG.host,
  port: ODOO_CONFIG.port,
  path: '/xmlrpc/2/common'
});

const modelsClient = xmlrpc.createSecureClient({
  host: ODOO_CONFIG.host,
  port: ODOO_CONFIG.port,
  path: '/xmlrpc/2/object'
});

// Authenticate with Odoo
function authenticate() {
  return new Promise((resolve, reject) => {
    if (authUid) return resolve(authUid);
    commonClient.methodCall(
      'authenticate',
      [ODOO_CONFIG.db, ODOO_CONFIG.username, ODOO_CONFIG.password, {}],
      (err, uid) => {
        if (err) return reject(err);
        if (!uid) return reject(new Error('Authentication failed: Invalid credentials'));
        authUid = uid;
        resolve(uid);
      }
    );
  });
}

// Call Odoo Model Method
function callModel(model, method, args, kwargs = {}) {
  return authenticate().then(uid => {
    return new Promise((resolve, reject) => {
      modelsClient.methodCall(
        'execute_kw',
        [ODOO_CONFIG.db, uid, ODOO_CONFIG.password, model, method, args, kwargs],
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      );
    });
  });
}

// Map Odoo Product to Catalog Format
function mapProduct(p, categMap) {
  let category = 'All';
  if (p.pos_categ_ids && p.pos_categ_ids.length > 0) {
    category = categMap[p.pos_categ_ids[0]] || 'Other';
  } else if (p.categ_id && p.categ_id[1]) {
    category = p.categ_id[1].split('/').pop().trim();
  }

  // Image handling
  let image = 'assets/products/coca_cola.png';
  if (p.image_128) {
    image = `data:image/png;base64,${p.image_128}`;
  } else if (p.name.toLowerCase().includes('coca-cola') || p.name.toLowerCase().includes('coca')) {
    image = 'assets/products/coca_cola.png';
  } else if (p.name.toLowerCase().includes('azam') || p.name.toLowerCase().includes('juice')) {
    image = 'assets/products/azam_juice.png';
  } else if (p.name.toLowerCase().includes('water') || p.name.toLowerCase().includes('afya')) {
    image = 'assets/products/mineral_water.png';
  } else if (p.name.toLowerCase().includes('nivea') || p.name.toLowerCase().includes('lotion')) {
    image = 'assets/products/nivea_lotion.png';
  } else if (p.name.toLowerCase().includes('samsung') || p.name.toLowerCase().includes('charger')) {
    image = 'assets/products/samsung_charger.png';
  } else if (p.name.toLowerCase().includes('rice')) {
    image = 'assets/products/mwanza_rice.png';
  } else if (p.name.toLowerCase().includes('oil')) {
    image = 'assets/products/cooking_oil.png';
  } else if (p.name.toLowerCase().includes('soap') || p.name.toLowerCase().includes('dettol')) {
    image = 'assets/products/dettol_soap.png';
  } else if (p.name.toLowerCase().includes('milk')) {
    image = 'assets/products/fresh_milk.png';
  } else if (p.name.toLowerCase().includes('flour')) {
    image = 'assets/products/azam_flour.png';
  } else if (p.name.toLowerCase().includes('earbud') || p.name.toLowerCase().includes('freepods')) {
    image = 'assets/products/oraimo_earbuds.png';
  } else if (p.name.toLowerCase().includes('detergent') || p.name.toLowerCase().includes('washing')) {
    image = 'assets/products/sunlight_detergent.png';
  }

  return {
    id: p.id,
    odooId: p.id,
    name: p.name,
    price: p.list_price || 0,
    qty_available: typeof p.qty_available === 'number' ? Math.max(0, p.qty_available) : 0,
    category: category,
    image: image,
    barcode: p.barcode || '',
    default_code: p.default_code || '',
    inStock: (p.qty_available || 0) > 0
  };
}

// Fetch all POS Products from Odoo
async function fetchOdooProducts(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedProducts.length > 0 && now - lastFetchTime < CACHE_TTL) {
    return { products: cachedProducts, categories: cachedCategories, cached: true };
  }

  if (isSyncing && cachedProducts.length > 0) {
    return { products: cachedProducts, categories: cachedCategories, cached: true };
  }

  isSyncing = true;
  try {
    // 1. Fetch POS categories
    const posCategs = await callModel('pos.category', 'search_read', [[]], {
      fields: ['id', 'name', 'parent_id']
    });

    const categMap = {};
    const categoriesList = ['All'];
    posCategs.forEach(c => {
      categMap[c.id] = c.name;
      if (!categoriesList.includes(c.name)) categoriesList.push(c.name);
    });

    // 2. Fetch active POS products
    const rawProducts = await callModel('product.product', 'search_read', [
      [['available_in_pos', '=', true]]
    ], {
      fields: [
        'id',
        'name',
        'list_price',
        'qty_available',
        'pos_categ_ids',
        'categ_id',
        'image_128',
        'default_code',
        'barcode'
      ],
      order: 'sequence asc, id desc'
    });

    const mapped = rawProducts.map(p => mapProduct(p, categMap));

    // Sort: mart products (Coca Cola, Azam, Water, Nivea, Charger, Rice) first, then others
    mapped.sort((a, b) => {
      const priorityNames = [
        'Coca-Cola 500ml',
        'Azam Juice 500ml',
        'Mineral Water 500ml',
        'Nivea Body Lotion',
        'Samsung Charger',
        'MWANZA RICE 1kg',
        'Coca-Cola',
        'Fanta',
        'Afya Water'
      ];
      const aIdx = priorityNames.findIndex(n => a.name.toLowerCase().includes(n.toLowerCase()));
      const bIdx = priorityNames.findIndex(n => b.name.toLowerCase().includes(n.toLowerCase()));
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return b.qty_available - a.qty_available;
    });

    cachedProducts = mapped;
    cachedCategories = categoriesList;
    lastFetchTime = Date.now();

    return { products: cachedProducts, categories: cachedCategories, cached: false };
  } catch (error) {
    console.error('[Odoo Sync Error]:', error.message || error);
    if (cachedProducts.length > 0) {
      return { products: cachedProducts, categories: cachedCategories, cached: true, error: error.message };
    }
    throw error;
  } finally {
    isSyncing = false;
  }
}

// Deduct Stock Directly in Odoo
async function deductStock(items, defaultLocationId = 28) {
  // items: [{ id: 167, qty: 2 }, ...]
  const results = [];

  for (const item of items) {
    const prodId = Number(item.id || item.odooId);
    const qtyToDeduct = Number(item.qty || 1);

    try {
      // Find quant in internal locations
      const quants = await callModel('stock.quant', 'search_read', [
        [['product_id', '=', prodId], ['location_id.usage', '=', 'internal']]
      ], {
        fields: ['id', 'quantity', 'location_id']
      });

      let updatedQty = 0;
      if (quants && quants.length > 0) {
        const qid = quants[0].id;
        const currentQty = quants[0].quantity;
        updatedQty = Math.max(0, currentQty - qtyToDeduct);
        await callModel('stock.quant', 'write', [[qid], { quantity: updatedQty }]);
      } else {
        // Quant creation if not existing
        await callModel('stock.quant', 'create', [{
          product_id: prodId,
          location_id: defaultLocationId,
          quantity: Math.max(0, 50 - qtyToDeduct)
        }]);
        updatedQty = Math.max(0, 50 - qtyToDeduct);
      }

      // Update in-memory cache immediately
      const cached = cachedProducts.find(p => p.id === prodId);
      if (cached) {
        cached.qty_available = updatedQty;
        cached.inStock = updatedQty > 0;
      }

      results.push({
        id: prodId,
        success: true,
        deducted: qtyToDeduct,
        remainingStock: updatedQty
      });
    } catch (err) {
      console.error(`Failed to deduct stock for product ${prodId}:`, err.message || err);
      results.push({
        id: prodId,
        success: false,
        error: err.message || String(err)
      });
    }
  }

  // Background refresh to sync exact figures
  setTimeout(() => fetchOdooProducts(true).catch(() => {}), 100);

  return results;
}

// Create Full Confirmed POS Order in Odoo
async function createOdooPosOrder(orderData) {
  // orderData: { customerPhone, totalAmount, items: [{ id: 167, name: 'Coca-Cola', price: 1000, qty: 2 }] }
  const ref = 'WEB-' + (orderData.orderId || ('NM-' + Math.floor(1000 + Math.random() * 9000)));
  const dateStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

  // 1. Deduct Stock quants
  const stockResults = await deductStock(orderData.items);

  // 2. Format lines for Odoo POS Order
  const lines = orderData.items.map(item => {
    const unitPrice = Number(item.price);
    const qty = Number(item.qty);
    const subtotal = unitPrice * qty;
    return [0, 0, {
      product_id: Number(item.id || item.odooId),
      qty: qty,
      price_unit: unitPrice,
      price_subtotal: subtotal,
      price_subtotal_incl: subtotal,
      discount: 0.0,
      customer_note: `Web Order Phone: ${orderData.customerPhone || ''}`
    }];
  });

  const total = Number(orderData.totalAmount || orderData.totalPaid || 0);

  // POS Order payload for session 58 / active session
  const posPayload = {
    name: `Order ${ref}`,
    pos_reference: ref,
    amount_paid: total,
    amount_total: total,
    amount_tax: 0.0,
    amount_return: 0.0,
    lines: lines,
    statement_ids: [
      [0, 0, {
        name: dateStr,
        amount: total,
        payment_method_id: 6, // Card / Electronic
        payment_date: dateStr
      }]
    ],
    pos_session_id: 58, // Active 'Website Orders' session
    user_id: 8,
    partner_id: false,
    uid: ref,
    sequence_number: Math.floor(Math.random() * 900) + 10,
    creation_date: dateStr,
    to_invoice: false
  };

  let odooOrderId = null;
  try {
    const res = await callModel('pos.order', 'sync_from_ui', [[posPayload]]);
    if (res && res['pos.order'] && res['pos.order'].length > 0) {
      odooOrderId = res['pos.order'][0].id;
    }
  } catch (posErr) {
    console.warn('[POS sync_from_ui fallback]:', posErr.message || posErr);
  }

  return {
    success: true,
    orderId: orderData.orderId || ref,
    odooOrderId: odooOrderId,
    totalPaid: total,
    stockResults: stockResults,
    phone: orderData.customerPhone,
    timestamp: dateStr
  };
}

module.exports = {
  ODOO_CONFIG,
  fetchOdooProducts,
  deductStock,
  createOdooPosOrder
};
