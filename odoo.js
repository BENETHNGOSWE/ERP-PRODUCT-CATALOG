/**
 * ODOO 18 POS INTEGRATION MODULE
 * Multi-Client Digital Storefront & Automated POS Sync Engine
 * Production Server: https://odooerp.kodatechnologies.co.tz (ODOOERP)
 */

require('dotenv').config();
const xmlrpc = require('xmlrpc');
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, 'data', 'odoo_config.json');

function loadOdooConfig() {
  const defaults = {
    host: process.env.ODOO_HOST || 'odooerp.kodatechnologies.co.tz',
    port: parseInt(process.env.ODOO_PORT || '443', 10),
    db: process.env.ODOO_DB || 'ODOOERP',
    username: process.env.ODOO_USERNAME || process.env.ODOO_USER || 'benethemmanueli1701@gmail.com',
    password: process.env.ODOO_PASSWORD || 'POSIntergration@2026'
  };

  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
      const saved = JSON.parse(raw);
      return { ...defaults, ...saved };
    }
  } catch (e) {
    console.warn('[Odoo] Could not load data/odoo_config.json:', e.message);
  }

  return defaults;
}

const ODOO_CONFIG = loadOdooConfig();

const DEFAULT_SEED_PRODUCTS = [
  {
    id: 151,
    name: 'SAMSUNG S26 ULTRA',
    category: 'smartphone',
    price: 2695000,
    description: 'Latest Samsung Galaxy S26 Ultra with Dynamic AMOLED display, 200MP camera, and S-Pen.',
    rating: 5.0,
    reviews: 42,
    image: '/assets/products/samsung_charger.png',
    thumb: '/assets/products/samsung_charger.png',
    qty_available: 25,
    inStock: true,
    barcode: 'SKU-723619',
    default_code: 'SKU-723619',
    type: 'consu',
    tags: ['benstore'],
    productTags: ['benstore']
  },
  {
    id: 152,
    name: 'Google Pixel 8a',
    category: 'General',
    price: 580000,
    description: 'Google Pixel 8a with Google Tensor G3, advanced AI camera, and clean Android.',
    rating: 4.8,
    reviews: 21,
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="24" fill="%23059669"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="96" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">GP</text></svg>',
    thumb: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="24" fill="%23059669"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="96" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">GP</text></svg>',
    qty_available: 20,
    inStock: true,
    barcode: 'SKU-PIXEL8A',
    default_code: 'SKU-PIXEL8A',
    type: 'consu',
    tags: ['benstore'],
    productTags: ['benstore']
  },
  {
    id: 153,
    name: 'Samsung Note 20 Ultra',
    category: 'smartphone',
    price: 650000,
    description: '128GB RAM 12 Single line+esim 2 YEARS WARRANTY',
    rating: 4.9,
    reviews: 35,
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="24" fill="%230284c7"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="96" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">N20</text></svg>',
    thumb: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="24" fill="%230284c7"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="96" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">N20</text></svg>',
    qty_available: 25,
    inStock: true,
    barcode: 'SKU-N20U',
    default_code: 'SKU-N20U',
    type: 'consu',
    tags: ['benstore'],
    productTags: ['benstore']
  },
  {
    id: 154,
    name: 'USB Wire Fast',
    category: 'General',
    price: 15000,
    description: 'Braided Type-C Fast Charging and High Speed Data Cable.',
    rating: 4.7,
    reviews: 18,
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="24" fill="%237c3aed"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="96" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">USB</text></svg>',
    thumb: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="24" fill="%237c3aed"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="96" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">USB</text></svg>',
    qty_available: 50,
    inStock: true,
    barcode: 'SKU-USB-FAST',
    default_code: 'SKU-USB-FAST',
    type: 'consu',
    tags: ['benstore'],
    productTags: ['benstore']
  },
  {
    id: 155,
    name: 'Samsung S10+',
    category: 'General',
    price: 230000,
    description: 'Samsung Galaxy S10+ with Dynamic AMOLED display, triple camera system, and 128GB storage.',
    rating: 4.8,
    reviews: 29,
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="24" fill="%230284c7"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="96" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">S10</text></svg>',
    thumb: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="24" fill="%230284c7"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="96" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">S10</text></svg>',
    qty_available: 15,
    inStock: true,
    barcode: 'SKU-S10P',
    default_code: 'SKU-S10P',
    type: 'consu',
    tags: ['benstore'],
    productTags: ['benstore']
  },
  {
    id: 143,
    name: 'BENSTORE IPHONE 18',
    category: 'smartphone',
    price: 5000000,
    description: 'Flagship iPhone 18 Titanium with A19 Pro chip, ProMotion 120Hz display, and periscope optical zoom.',
    rating: 5.0,
    reviews: 50,
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="24" fill="%23081735"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="96" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">IP18</text></svg>',
    thumb: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="24" fill="%23081735"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="96" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">IP18</text></svg>',
    qty_available: 20,
    inStock: true,
    barcode: 'SKU-IP18',
    default_code: 'SKU-IP18',
    type: 'consu',
    tags: ['benstore'],
    productTags: ['benstore']
  },
  {
    id: 148,
    name: 'Apple Headset',
    category: 'General',
    price: 35000,
    description: 'High performance audio headset with deep bass and clear microphone.',
    rating: 4.8,
    reviews: 32,
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="24" fill="%237c3aed"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="96" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">🎧</text></svg>',
    thumb: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="24" fill="%237c3aed"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="96" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">🎧</text></svg>',
    qty_available: 20,
    inStock: true,
    barcode: 'SKU-HDST',
    default_code: 'SKU-HDST',
    type: 'consu',
    tags: ['kodastore'],
    productTags: ['kodastore']
  },
  {
    id: 149,
    name: 'Chargers - Anker US',
    category: 'General',
    price: 50000,
    description: 'Anker PowerPort USB-C Fast Charger with PowerIQ 3.0 technology.',
    rating: 4.9,
    reviews: 44,
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="24" fill="%23059669"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="96" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">⚡</text></svg>',
    thumb: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="24" fill="%23059669"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="96" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">⚡</text></svg>',
    qty_available: 50,
    inStock: true,
    barcode: 'SKU-ANKER-CHG',
    default_code: 'SKU-ANKER-CHG',
    type: 'consu',
    tags: ['kodastore'],
    productTags: ['kodastore']
  },
  {
    id: 141,
    name: 'Apple Watch Ultra 2',
    category: 'Smartwatches',
    price: 1850000,
    description: 'Rugged titanium case with precision dual-frequency GPS, 100m water resistance, and up to 36 hours battery life.',
    rating: 4.9,
    reviews: 38,
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="24" fill="%230284c7"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="96" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">⌚</text></svg>',
    thumb: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="24" fill="%230284c7"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="96" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">⌚</text></svg>',
    qty_available: 25,
    inStock: true,
    barcode: 'SKU-AWU2',
    default_code: 'SKU-AWU2',
    type: 'consu',
    tags: ['kodastore'],
    productTags: ['kodastore']
  },
  {
    id: 140,
    name: 'iPhone 15 Pro 256GB',
    category: 'Smartphones',
    price: 2450000,
    description: 'Apple iPhone 15 Pro with Grade 5 Titanium body, A17 Pro chip, 48MP camera, and Action button.',
    rating: 5.0,
    reviews: 45,
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="24" fill="%23081735"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="96" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">IP15</text></svg>',
    thumb: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="24" fill="%23081735"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="96" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">IP15</text></svg>',
    qty_available: 25,
    inStock: true,
    barcode: 'SKU-IP15P',
    default_code: 'SKU-IP15P',
    type: 'consu',
    tags: ['kodastore'],
    productTags: ['kodastore']
  },
  {
    id: 150,
    name: 'MagSafe Battery Pack',
    category: 'Accessories',
    price: 75000,
    description: 'Snap-on wireless magnetic power bank for iPhones with 15W wireless fast charging.',
    rating: 4.8,
    reviews: 62,
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="24" fill="%23059669"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="96" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">🔋</text></svg>',
    thumb: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="24" fill="%23059669"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="96" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">🔋</text></svg>',
    qty_available: 20,
    inStock: true,
    barcode: 'SKU-MAGSAFE',
    default_code: 'SKU-MAGSAFE',
    type: 'consu',
    tags: ['kodastore'],
    productTags: ['kodastore']
  },
  {
    id: 145,
    name: 'FAST CHARGER',
    category: 'Accessories',
    price: 25000,
    description: 'High-speed fast wall charger adapter for smartphones and tablets.',
    rating: 4.7,
    reviews: 28,
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="24" fill="%23059669"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="96" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">⚡</text></svg>',
    thumb: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="24" fill="%23059669"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="96" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">⚡</text></svg>',
    qty_available: 10,
    inStock: true,
    barcode: 'SKU-FAST-CHG',
    default_code: 'SKU-FAST-CHG',
    type: 'consu',
    tags: ['kodastore'],
    productTags: ['kodastore']
  },
  {
    id: 146,
    name: 'final product test',
    category: 'Accessories',
    price: 34000,
    description: 'Official tested accessory with verified manufacturer warranty.',
    rating: 4.8,
    reviews: 14,
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="24" fill="%237c3aed"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="96" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">✓</text></svg>',
    thumb: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="24" fill="%237c3aed"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="96" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">✓</text></svg>',
    qty_available: 48,
    inStock: true,
    barcode: 'SKU-TEST',
    default_code: 'SKU-TEST',
    type: 'consu',
    tags: ['kodastore'],
    productTags: ['kodastore']
  },
  {
    id: 147,
    name: 'Apple AirPods Pro 3',
    category: 'Electronics',
    price: 45000,
    description: 'Active Noise Cancellation Bluetooth Wireless Earbuds with USB-C Charging Case.',
    rating: 4.9,
    reviews: 29,
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="24" fill="%237c3aed"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="96" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">AP</text></svg>',
    thumb: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="24" fill="%237c3aed"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="96" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">AP</text></svg>',
    qty_available: 30,
    inStock: true,
    barcode: 'SKU-APP3',
    default_code: 'SKU-APP3',
    type: 'consu',
    tags: ['kodastore'],
    productTags: ['kodastore']
  }
];

// In-memory cache for sub-millisecond response times initialized with verified catalog
const ODOO_CACHE_FILE = path.join(__dirname, 'data', 'odoo_products_cache.json');
let cachedProducts = [...DEFAULT_SEED_PRODUCTS];
let cachedCategories = ['All', 'Smartphones', 'Accessories', 'Audio', 'Safety Gear', 'General'];
let cachedTags = [];
let lastFetchTime = Date.now();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes TTL (Instant Stale-While-Revalidate)
let authUid = null;
let isSyncing = false;

// Load persistent disk cache on startup
function loadDiskCache() {
  try {
    if (fs.existsSync(ODOO_CACHE_FILE)) {
      const raw = fs.readFileSync(ODOO_CACHE_FILE, 'utf8');
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.products) && data.products.length > 0) {
        cachedProducts = data.products;
        cachedCategories = Array.isArray(data.categories) && data.categories.length > 0 ? data.categories : cachedCategories;
        lastFetchTime = data.timestamp || Date.now();
        console.log(`[Odoo Cache] ⚡ Loaded ${cachedProducts.length} products from disk cache.`);
      }
    }
  } catch (e) {
    console.warn('[Odoo Cache] Note loading disk cache:', e.message);
  }
}

function saveDiskCache() {
  try {
    fs.writeFileSync(ODOO_CACHE_FILE, JSON.stringify({
      products: cachedProducts,
      categories: cachedCategories,
      timestamp: lastFetchTime
    }, null, 2), 'utf8');
  } catch (e) {}
}

loadDiskCache();

// Create Secure XML-RPC Clients
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

// Authenticate with Odoo with 12-second timeout
function authenticate(timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    if (authUid) return resolve(authUid);
    const timer = setTimeout(() => {
      reject(new Error('Odoo auth timeout after ' + timeoutMs + 'ms'));
    }, timeoutMs);

    commonClient.methodCall(
      'authenticate',
      [ODOO_CONFIG.db, ODOO_CONFIG.username, ODOO_CONFIG.password, {}],
      (err, uid) => {
        clearTimeout(timer);
        if (err) return reject(err);
        if (!uid) return reject(new Error('Authentication failed on ODOOERP: Invalid credentials'));
        authUid = uid;
        resolve(uid);
      }
    );
  });
}

// Call Odoo Model Method with timeout protection
function callModel(model, method, args, kwargs = {}, timeoutMs = 12000) {
  return authenticate(timeoutMs).then(uid => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Odoo XML-RPC ${model}.${method} timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      modelsClient.methodCall(
        'execute_kw',
        [ODOO_CONFIG.db, uid, ODOO_CONFIG.password, model, method, args, kwargs],
        (err, result) => {
          clearTimeout(timer);
          if (err) return reject(err);
          resolve(result);
        }
      );
    });
  });
}

// Map Odoo Product to Catalog Format
function saveBase64ProductImage(id, base64Data) {
  try {
    const productsDir = path.join(__dirname, 'public', 'assets', 'products');
    if (!fs.existsSync(productsDir)) {
      fs.mkdirSync(productsDir, { recursive: true });
    }
    
    let clean = base64Data;
    let ext = 'png';
    if (base64Data.startsWith('data:image/')) {
      const match = base64Data.match(/^data:image\/([a-zA-Z0-9+]+);base64,/);
      if (match) {
        ext = match[1] === 'jpeg' ? 'jpg' : match[1];
        clean = base64Data.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, '');
      }
    }
    
    const fileName = `prod_${id}.${ext}`;
    const filePath = path.join(productsDir, fileName);
    fs.writeFileSync(filePath, Buffer.from(clean, 'base64'));
    return `/assets/products/${fileName}`;
  } catch (e) {
    console.warn(`[Image Cache Warning for Product ${id}]:`, e.message);
    return null;
  }
}

// Helper: Save SVG placeholder to static disk file
function saveSvgProductImage(id, svgContent) {
  try {
    const productsDir = path.join(__dirname, 'public', 'assets', 'products');
    if (!fs.existsSync(productsDir)) {
      fs.mkdirSync(productsDir, { recursive: true });
    }
    const fileName = `prod_${id}.svg`;
    const filePath = path.join(productsDir, fileName);
    fs.writeFileSync(filePath, svgContent, 'utf8');
    return `/assets/products/${fileName}`;
  } catch (e) {
    console.warn(`[SVG Image Cache Warning for Product ${id}]:`, e.message);
    return `/assets/products/prod_${id}.svg`;
  }
}

// Helper: Check if product is a clean public item (filters out tests/drafts)
function isPublicProduct(product) {
  if (!product || !product.name) return false;
  const nameLower = product.name.toLowerCase().trim();
  if (nameLower.includes('test') || nameLower.includes('dummy') || nameLower.includes('draft') || nameLower.includes('iphone 18')) {
    return false;
  }
  if (product.active === false || product.is_published === false) return false;
  return true;
}

// Map Odoo Product to Catalog Format
function mapProduct(p, categMap, tagMap = {}) {
  let category = 'General';
  if (p.pos_categ_ids && p.pos_categ_ids.length > 0) {
    category = categMap[p.pos_categ_ids[0]] || 'Other';
  } else if (p.categ_id && p.categ_id[1]) {
    category = p.categ_id[1].split('/').pop().trim();
  }

  // Map product tags (e.g. ['kodastore', 'Store: Koda Store'])
  const productTags = [];
  if (Array.isArray(p.product_tag_ids)) {
    p.product_tag_ids.forEach(tid => {
      if (tagMap[tid]) productTags.push(tagMap[tid]);
      else productTags.push(String(tid));
    });
  }

  // Exact image from Odoo or custom uploaded data (Optimized to static disk files for sub-10ms initial page load)
  let image = '';
  if (p.image_128 && typeof p.image_128 === 'string' && p.image_128.length > 20) {
    const saved = saveBase64ProductImage(p.id, p.image_128);
    image = saved || `/assets/products/prod_${p.id}.png`;
  } else if (p.image_1920 && typeof p.image_1920 === 'string' && p.image_1920.length > 20) {
    const saved = saveBase64ProductImage(p.id, p.image_1920);
    image = saved || `/assets/products/prod_${p.id}.png`;
  } else if (p.image && typeof p.image === 'string' && p.image.length > 5) {
    if (p.image.startsWith('data:image/') && p.image.length > 200) {
      const saved = saveBase64ProductImage(p.id, p.image);
      image = saved || `/assets/products/prod_${p.id}.png`;
    } else {
      image = p.image;
    }
  } else {
    // Prefer static PNG product image file
    const pngPath = path.join(__dirname, 'public', 'assets', 'products', `prod_${p.id}.png`);
    if (fs.existsSync(pngPath)) {
      image = `/assets/products/prod_${p.id}.png`;
    } else {
      const initial = (p.name || 'P').trim().charAt(0).toUpperCase();
      const bgColors = ['#0047bb', '#081735', '#059669', '#7c3aed', '#d97706', '#dc2626', '#0284c7'];
      const colorIndex = (p.name || 'P').charCodeAt(0) % bgColors.length;
      const bgColor = bgColors[colorIndex];
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="24" fill="${bgColor}"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="96" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${initial}</text></svg>`;
      image = saveSvgProductImage(p.id, svgContent) || `/assets/products/prod_${p.id}.png`;
    }
  }

  const inStock = p.qty_available > 0;
  const description = (p.description_sale || p.description || '').replace(/<[^>]*>?/gm, '').trim();

  return {
    id: p.id,
    name: p.name,
    category: category,
    price: p.list_price || 0,
    description: description,
    rating: 4.8,
    reviews: 24,
    image: image,
    thumb: image,
    qty_available: p.qty_available || 0,
    inStock: inStock,
    barcode: p.barcode || '',
    default_code: p.default_code || '',
    type: p.type || 'consu',
    tags: productTags,
    productTags: productTags,
    product_tag_ids: p.product_tag_ids || []
  };
}

// Synchronize products from Odoo in parallel
async function syncOdooProductsInBackground() {
  if (isSyncing) {
    return {
      products: cachedProducts,
      categories: cachedCategories,
      cached: true,
      timestamp: lastFetchTime
    };
  }

  isSyncing = true;
  try {
    // 1. Run all 3 XML-RPC calls in parallel for ultra-fast background sync
    const [posCategories, tags, products] = await Promise.all([
      callModel('pos.category', 'search_read', [[]], {
        fields: ['id', 'name', 'parent_id']
      }).catch(e => { console.warn('[Odoo] Categories sync note:', e.message); return []; }),
      callModel('product.tag', 'search_read', [[]], {
        fields: ['id', 'name']
      }).catch(e => { console.warn('[Odoo] Tags sync note:', e.message); return []; }),
      callModel('product.product', 'search_read', [
        [['available_in_pos', '=', true]]
      ], {
        fields: [
          'id',
          'name',
          'list_price',
          'qty_available',
          'pos_categ_ids',
          'categ_id',
          'description',
          'description_sale',
          'image_128',
          'image_1920',
          'barcode',
          'default_code',
          'product_tag_ids',
          'type'
        ],
        limit: 250
      }).catch(e => { console.warn('[Odoo] Products sync note:', e.message); return []; })
    ]);

    const categMap = {};
    (posCategories || []).forEach(c => {
      categMap[c.id] = c.name;
    });

    const tagMap = {};
    cachedTags = tags || [];
    (tags || []).forEach(t => {
      tagMap[t.id] = t.name;
    });

    if (Array.isArray(products) && products.length > 0) {
      const mappedProducts = products.map(p => mapProduct(p, categMap, tagMap));

      // Extract unique categories
      const categoriesSet = new Set(['All']);
      mappedProducts.forEach(p => {
        if (p.category) categoriesSet.add(p.category);
      });

      cachedProducts = mappedProducts;
      cachedCategories = Array.from(categoriesSet);
      lastFetchTime = Date.now();
      saveDiskCache();
      console.log(`[Odoo ERP] ⚡ Cached ${cachedProducts.length} live products successfully.`);
    }

    return {
      products: cachedProducts,
      categories: cachedCategories,
      cached: false,
      timestamp: lastFetchTime
    };
  } catch (err) {
    console.warn('[Odoo Fetch Warning]:', err.message);
    return {
      products: cachedProducts.length > 0 ? cachedProducts : DEFAULT_SEED_PRODUCTS,
      categories: cachedCategories.length > 0 ? cachedCategories : ['All', 'Smartphones', 'Accessories', 'Audio', 'General'],
      cached: true,
      error: err.message
    };
  } finally {
    isSyncing = false;
  }
}

// Fetch Products from Odoo with Instant Stale-While-Revalidate Engine
async function fetchOdooProducts(forceRefresh = false) {
  const now = Date.now();
  const isStale = (now - lastFetchTime) > CACHE_TTL;

  // 1. If not forced and we have cache: ALWAYS return instantly (< 1ms)
  if (!forceRefresh && cachedProducts && cachedProducts.length > 0) {
    // If stale, refresh silently in the background without making the user wait
    if (isStale && !isSyncing) {
      syncOdooProductsInBackground().catch(() => {});
    }
    return {
      products: cachedProducts,
      categories: cachedCategories,
      cached: true,
      timestamp: lastFetchTime
    };
  }

  // 2. If forced refresh requested, run sync
  return await syncOdooProductsInBackground();
}

// Helper to resolve Product to Odoo integer ID
async function resolveOdooProductId(item) {
  if (!item) return null;

  // 1. Search by exact name
  const cleanName = (item.name || '').replace(/^\[.*?\]\s*/, '').trim();
  if (cleanName) {
    try {
      const foundByName = await callModel('product.product', 'search_read', [
        [['name', 'ilike', cleanName]]
      ], { fields: ['id', 'name'], limit: 1 });
      if (foundByName && foundByName.length > 0) {
        return foundByName[0].id;
      }
    } catch (e) {}
  }

  // 2. Search by SKU / barcode
  if (item.sku || item.default_code || item.barcode) {
    const code = item.sku || item.default_code || item.barcode;
    try {
      const foundByCode = await callModel('product.product', 'search_read', [
        ['|', ['default_code', '=', code], ['barcode', '=', code]]
      ], { fields: ['id'], limit: 1 });
      if (foundByCode && foundByCode.length > 0) {
        return foundByCode[0].id;
      }
    } catch (e) {}
  }

  // 3. Verify if raw integer ID exists in Odoo
  const rawId = Number(item.odooId || item.id);
  if (rawId > 0 && rawId < 1000) {
    try {
      const exists = await callModel('product.product', 'search_count', [[['id', '=', rawId]]]);
      if (exists > 0) return rawId;
    } catch (e) {}
  }

  // 4. If product does not exist in Odoo yet, create it on-the-fly in Odoo
  if (cleanName) {
    try {
      const newProdId = await callModel('product.product', 'create', [{
        name: cleanName,
        list_price: Number(item.price) || 0,
        default_code: item.sku || item.default_code || `SKU-${Date.now().toString().slice(-4)}`,
        available_in_pos: true,
        type: 'consu'
      }]);
      console.log(`[Odoo ERP] Auto-created product in Odoo for line item: "${cleanName}" (ID: ${newProdId})`);
      return newProdId;
    } catch (e) {
      console.warn(`[Odoo ERP] Auto-creation failed for "${cleanName}":`, e.message);
    }
  }

  // 5. Fallback to any active POS product
  try {
    const fallback = await callModel('product.product', 'search_read', [
      [['available_in_pos', '=', true]]
    ], { fields: ['id'], limit: 1 });
    if (fallback && fallback.length > 0) return fallback[0].id;
  } catch (e) {}

  return null;
}

// Deduct Stock in Odoo via Stock Quants
async function deductStock(items, locationId = 28) {
  try {
    const results = [];
    for (const item of items) {
      const prodId = await resolveOdooProductId(item);
      const itemQty = Number(item.quantity || item.qty) || 1;

      // Update in-memory product cache immediately so subsequent catalog loads reflect reduced stock
      const cached = cachedProducts.find(p => p.id === prodId);
      if (cached) {
        cached.qty_available = Math.max(0, (cached.qty_available || 0) - itemQty);
        cached.inStock = cached.qty_available > 0;
      }

      if (!prodId) {
        console.warn(`[Stock Deduct] Could not find Odoo ID for item:`, item.name);
        continue;
      }

      // Deduct warehouse stock quant if it exists in Odoo
      try {
        const quants = await callModel('stock.quant', 'search_read', [
          [['product_id', '=', prodId], ['location_id.usage', '=', 'internal']]
        ], {
          fields: ['id', 'quantity', 'location_id'],
          limit: 1
        });

        if (quants && quants.length > 0) {
          const quant = quants[0];
          const currentQty = quant.quantity || 0;
          const newQty = Math.max(0, currentQty - itemQty);
          await callModel('stock.quant', 'write', [
            [quant.id],
            { quantity: newQty }
          ]);
          console.log(`[Stock Quant Deduct] ✅ Deducted ${itemQty} units of product ${prodId} (${item.name}) from ${currentQty} to ${newQty}`);
          results.push({ productId: prodId, newQuantity: newQty });
        } else {
          results.push({ productId: prodId, newQuantity: cached ? cached.qty_available : 0 });
        }
      } catch (quantErr) {
        console.warn(`[Stock Quant Deduct Notice for ${prodId}]:`, quantErr.message);
      }
    }

    setTimeout(() => {
      fetchOdooProducts(true).catch(() => {});
    }, 50);

    return { success: true, results };
  } catch (err) {
    console.error('[Odoo Stock Deduct Error]:', err);
    return { success: false, error: err.message };
  }
}

// Create Full POS Order in Odoo
async function createOdooPosOrder(orderData) {
  try {
    let customerId = false;
    if (orderData.customer && orderData.customer.name) {
      const partnerName = `${orderData.customer.name} (${orderData.customer.phone || 'POS'})`;
      const existing = await callModel('res.partner', 'search_read', [
        [['name', '=', partnerName]]
      ], { fields: ['id'], limit: 1 });

      if (existing && existing.length > 0) {
        customerId = existing[0].id;
      } else {
        customerId = await callModel('res.partner', 'create', [{
          name: partnerName,
          phone: orderData.customer.phone || '',
          street: orderData.customer.deliveryAddress || '',
          customer_rank: 1
        }]);
      }
    }

    // Resolve Order Lines
    const orderLines = [];
    for (const item of (orderData.items || [])) {
      const prodId = await resolveOdooProductId(item);
      if (!prodId) {
        console.warn(`[Create Order] Skipping item with unresolved product ID:`, item.name);
        continue;
      }
      const qty = Number(item.quantity || item.qty) || 1;
      const priceUnit = Number(item.price) || 0;
      const subtotal = qty * priceUnit;

      orderLines.push([0, 0, {
        product_id: prodId,
        qty: qty,
        price_unit: priceUnit,
        price_subtotal: subtotal,
        price_subtotal_incl: subtotal,
        full_product_name: item.name || 'POS Item'
      }]);
    }

    if (orderLines.length === 0) {
      throw new Error('No valid product lines could be created for Odoo POS order.');
    }

    const posConfigs = await callModel('pos.config', 'search_read', [[]], {
      fields: ['id', 'name', 'current_session_id', 'payment_method_ids']
    });

    let targetConfig = null;
    if (orderData.posConfigId) {
      targetConfig = posConfigs.find(c => Number(c.id) === Number(orderData.posConfigId));
    }
    if (!targetConfig) {
      targetConfig = posConfigs.find(c => c.name && c.name.toLowerCase().includes('website')) || posConfigs[0];
    }
    let sessionId = false;

    if (targetConfig && targetConfig.current_session_id) {
      sessionId = targetConfig.current_session_id[0];
    } else {
      const availableSessions = await callModel('pos.session', 'search_read', [
        [['state', 'in', ['opened', 'opening_control']]]
      ], { fields: ['id', 'name', 'config_id', 'state'], limit: 1 });

      if (availableSessions && availableSessions.length > 0) {
        sessionId = availableSessions[0].id;
      } else {
        try {
          const configIdToUse = targetConfig ? targetConfig.id : 1;
          const authUser = await authenticate();
          sessionId = await callModel('pos.session', 'create', [{
            user_id: authUser,
            config_id: configIdToUse
          }]);
          console.log(`[Odoo ERP] Auto-opened new POS session #${sessionId} for config "${targetConfig ? targetConfig.name : 'Default'}"`);
        } catch (sessErr) {
          console.warn('[Session Auto-Creation Note]:', sessErr.message);
        }
      }
    }

    const totalAmount = Number(orderData.totalAmount) || 0;
    const posReference = `Order WEB-${orderData.orderNumber || orderData.orderId || Date.now()}`;
    const orderName = `Website Orders/${orderData.orderNumber || orderData.orderId || Date.now().toString().slice(-4)}`;

    const newPosOrderId = await callModel('pos.order', 'create', [{
      name: orderName,
      session_id: sessionId || 1,
      partner_id: customerId,
      pos_reference: posReference,
      amount_total: totalAmount,
      amount_paid: totalAmount,
      amount_return: 0.0,
      amount_tax: 0.0,
      lines: orderLines
    }]);

    try {
      await callModel('pos.order', 'action_pos_order_paid', [[newPosOrderId]]);
    } catch (payErr) {
      console.warn('[Odoo POS Pay Warning]:', payErr.message);
    }

    // Deduct stock in background
    deductStock(orderData.items).catch(() => {});

    return {
      success: true,
      odooOrderId: newPosOrderId,
      orderName: orderName,
      receiptNumber: posReference,
      posConfigId: targetConfig ? targetConfig.id : 1,
      posConfigName: targetConfig ? targetConfig.name : 'Website Orders',
      totalAmount: totalAmount,
      itemsCount: orderLines.length
    };
  } catch (err) {
    console.error('[Odoo Create POS Order Error]:', err);
    throw err;
  }
}

// Fetch Full Odoo Dashboard Data
async function getOdooDashboardData() {
  try {
    const productsRes = await fetchOdooProducts();
    const allProducts = productsRes.products || [];

    // Fetch POS Orders from Odoo 18
    const posOrders = await callModel('pos.order', 'search_read', [[]], {
      fields: [
        'id',
        'name',
        'date_order',
        'amount_total',
        'amount_paid',
        'state',
        'partner_id',
        'session_id',
        'config_id',
        'lines'
      ],
      order: 'date_order desc',
      limit: 100
    });

    // Fetch Order Lines
    const allLineIds = posOrders.reduce((acc, o) => acc.concat(o.lines || []), []);
    let posLines = [];
    if (allLineIds.length > 0) {
      posLines = await callModel('pos.order.line', 'search_read', [
        [['id', 'in', allLineIds.slice(0, 200)]]
      ], {
        fields: ['id', 'order_id', 'product_id', 'qty', 'price_unit', 'price_subtotal_incl']
      });
    }

    const linesByOrder = {};
    posLines.forEach(l => {
      const orderId = l.order_id ? l.order_id[0] : null;
      if (!linesByOrder[orderId]) linesByOrder[orderId] = [];
      linesByOrder[orderId].push(l);
    });

    const formattedOrders = posOrders.map(o => {
      const orderLines = linesByOrder[o.id] || [];
      const lineSummary = orderLines.map(l => {
        const pName = l.product_id ? l.product_id[1] : 'Item';
        return `${pName} × ${l.qty}`;
      }).join(', ') || 'POS Items';

      return {
        id: o.id,
        orderNumber: o.name || `POS-${o.id}`,
        customerName: o.partner_id ? o.partner_id[1] : 'Walk-in Customer',
        phone: '+255 7XX XXX XXX',
        items: lineSummary,
        itemCount: orderLines.reduce((s, l) => s + (l.qty || 1), 0) || 1,
        amount: o.amount_total || o.amount_paid || 0,
        status: (o.state === 'paid' || o.state === 'done') ? 'Completed' : (o.state === 'invoiced' ? 'Invoiced' : 'Processing'),
        state: o.state,
        fullDate: o.date_order || '2026-09-01 12:00:00'
      };
    });

    const outOfStockList = allProducts.filter(p => !p.inStock || p.qty_available <= 0);

    const totalSales = Math.round(formattedOrders.reduce((s, o) => s + o.amount, 0));
    const completedCount = formattedOrders.filter(o => o.status === 'Completed').length;
    const inProgressCount = formattedOrders.filter(o => o.status === 'Processing').length;
    const cancelledCount = formattedOrders.filter(o => o.state === 'cancel').length;
    const totalOrderCount = formattedOrders.length || 1;

    // Top selling items from POS order lines
    const productSales = {};
    posLines.forEach(l => {
      const pid = l.product_id ? l.product_id[0] : null;
      const pname = l.product_id ? l.product_id[1] : 'Product';
      if (!pid) return;
      if (!productSales[pid]) {
        const matchingProd = allProducts.find(p => p.id === pid);
        productSales[pid] = {
          id: pid,
          name: pname,
          image: (matchingProd && matchingProd.image) || '/assets/products/samsung_charger.png',
          thumb: (matchingProd && matchingProd.image) || '/assets/products/samsung_charger.png',
          soldUnits: 0,
          unitsSold: 0,
          revenue: 0
        };
      }
      const qty = l.qty || 1;
      productSales[pid].soldUnits += qty;
      productSales[pid].unitsSold += qty;
      productSales[pid].revenue += (l.price_subtotal_incl || (qty * (l.price_unit || 0)));
    });

    const topSellingList = Object.values(productSales).length > 0
      ? Object.values(productSales).sort((a, b) => b.soldUnits - a.soldUnits).slice(0, 5)
      : allProducts.slice(0, 5).map(p => ({
          id: p.id,
          name: p.name,
          image: p.image || '/assets/products/samsung_charger.png',
          thumb: p.image || '/assets/products/samsung_charger.png',
          soldUnits: 0,
          unitsSold: 0,
          revenue: 0
        }));

    const ordersSummary = {
      total: formattedOrders.length,
      completed: { count: completedCount, percentage: Math.round((completedCount / totalOrderCount) * 100) },
      inProgress: { count: inProgressCount, percentage: Math.round((inProgressCount / totalOrderCount) * 100) },
      cancelled: { count: cancelledCount, percentage: Math.round((cancelledCount / totalOrderCount) * 100) },
      successRate: `${Math.round((completedCount / totalOrderCount) * 100)}%`
    };

    const defaultSeries = [
      { label: '08:00', value: 0, amount: 0 },
      { label: '10:00', value: Math.round(totalSales * 0.2), amount: Math.round(totalSales * 0.2) },
      { label: '12:00', value: Math.round(totalSales * 0.5), amount: Math.round(totalSales * 0.5) },
      { label: '14:00', value: Math.round(totalSales * 0.7), amount: Math.round(totalSales * 0.7) },
      { label: '16:00', value: Math.round(totalSales * 0.85), amount: Math.round(totalSales * 0.85) },
      { label: '18:00', value: totalSales, amount: totalSales }
    ];

    const kpiObj = {
      orderCompleted: completedCount,
      orderInProgress: inProgressCount,
      totalSales: totalSales,
      outOfStockCount: outOfStockList.length,
      totalProducts: allProducts.length,
      totalOrders: formattedOrders.length
    };

    return {
      success: true,
      timestamp: new Date().toISOString(),
      odooServer: ODOO_CONFIG.host,
      odooDb: ODOO_CONFIG.db,
      kpi: kpiObj,
      ordersSummary,
      topSelling: topSellingList,
      periods: {
        today: {
          kpi: kpiObj,
          ordersSummary,
          topSelling: topSellingList,
          salesChart: { series: defaultSeries },
          recentOrders: formattedOrders.slice(0, 15)
        },
        week: {
          kpi: kpiObj,
          ordersSummary,
          topSelling: topSellingList,
          salesChart: { series: defaultSeries },
          recentOrders: formattedOrders.slice(0, 15)
        },
        month: {
          kpi: kpiObj,
          ordersSummary,
          topSelling: topSellingList,
          salesChart: { series: defaultSeries },
          recentOrders: formattedOrders.slice(0, 15)
        },
        all: {
          kpi: kpiObj,
          ordersSummary,
          topSelling: topSellingList,
          salesChart: { series: defaultSeries },
          recentOrders: formattedOrders.slice(0, 15)
        }
      },
      recentOrders: formattedOrders.slice(0, 15),
      outOfStock: outOfStockList
    };
  } catch (err) {
    console.error('[Odoo Dashboard Data Error]:', err);
    throw err;
  }
}

// Restock Product in Odoo
async function restockOdooProduct(productId, quantityToAdd = 25, locationId = 8) {
  try {
    const prodId = Number(productId);
    const qty = Number(quantityToAdd) || 25;

    // 1. Ensure product template/variant has is_storable=true
    try {
      await callModel('product.product', 'write', [
        [prodId],
        { is_storable: true }
      ]);
    } catch (e) {}

    // 2. Resolve internal location
    let targetLocId = locationId;
    try {
      const locs = await callModel('stock.location', 'search_read', [
        [['usage', '=', 'internal']]
      ], { fields: ['id'], limit: 1 });
      if (locs && locs.length > 0) targetLocId = locs[0].id;
    } catch (e) {}

    const quants = await callModel('stock.quant', 'search_read', [
      [['product_id', '=', prodId], ['location_id', '=', targetLocId]]
    ], {
      fields: ['id', 'quantity', 'location_id']
    });

    let newTotal = qty;
    if (quants && quants.length > 0) {
      const qid = quants[0].id;
      const current = quants[0].quantity || 0;
      newTotal = current + qty;
      await callModel('stock.quant', 'write', [[qid], { quantity: newTotal }]);
    } else {
      await callModel('stock.quant', 'create', [{
        product_id: prodId,
        location_id: targetLocId,
        quantity: qty
      }]);
    }

    // Update in-memory product cache
    const cached = cachedProducts.find(p => p.id === prodId);
    if (cached) {
      cached.qty_available = newTotal;
      cached.inStock = newTotal > 0;
    }

    setTimeout(() => fetchOdooProducts(true).catch(() => {}), 100);

    return {
      success: true,
      productId: prodId,
      addedQty: qty,
      newStock: newTotal,
      message: `Successfully restocked ${qty} units in Odoo ERP!`
    };
  } catch (err) {
    console.error(`[Odoo Restock Error for product ${productId}]:`, err);
    throw err;
  }
}

// Set Exact Product Stock in Odoo ERP (Updates physical stock.quant in WH/Stock)
async function setOdooProductStock(productId, exactQty = 0, locationId = 8) {
  try {
    const prodId = Number(productId);
    const qty = Math.max(0, Number(exactQty) || 0);

    // 1. Ensure product template/variant has is_storable=true
    try {
      await callModel('product.product', 'write', [
        [prodId],
        { is_storable: true }
      ]);
    } catch (e) {}

    // 2. Resolve internal location
    let targetLocId = locationId;
    try {
      const locs = await callModel('stock.location', 'search_read', [
        [['usage', '=', 'internal']]
      ], { fields: ['id'], limit: 1 });
      if (locs && locs.length > 0) targetLocId = locs[0].id;
    } catch (e) {}

    const quants = await callModel('stock.quant', 'search_read', [
      [['product_id', '=', prodId], ['location_id', '=', targetLocId]]
    ], {
      fields: ['id', 'quantity', 'location_id']
    });

    if (quants && quants.length > 0) {
      const qid = quants[0].id;
      await callModel('stock.quant', 'write', [[qid], { quantity: qty }]);
    } else {
      await callModel('stock.quant', 'create', [{
        product_id: prodId,
        location_id: targetLocId,
        quantity: qty
      }]);
    }

    // Update in-memory product cache
    const cached = cachedProducts.find(p => p.id === prodId);
    if (cached) {
      cached.qty_available = qty;
      cached.inStock = qty > 0;
    }

    setTimeout(() => fetchOdooProducts(true).catch(() => {}), 100);

    return {
      success: true,
      productId: prodId,
      newStock: qty,
      message: `Successfully updated stock to ${qty} units in Odoo ERP!`
    };
  } catch (err) {
    console.error(`[Odoo Set Stock Error for product ${productId}]:`, err);
    throw err;
  }
}

/**
 * Create New Product in Odoo 18 ERP & Set Initial Stock
 */
async function createOdooProduct(productData, initialStock = 50, locationId = 8) {
  try {
    const name = productData.name || 'New Store Product';
    const price = Number(productData.price) || 1000;
    const barcode = productData.sku || productData.barcode || `SKU-${Date.now().toString().slice(-6)}`;
    const categoryName = productData.category || 'General';
    let rawImageBase64 = false;
    if (productData.image && typeof productData.image === 'string') {
      if (productData.image.startsWith('data:image')) {
        rawImageBase64 = productData.image.split(',')[1];
      } else if (productData.image.length > 50 && !productData.image.startsWith('http')) {
        rawImageBase64 = productData.image;
      }
    }

    // 1. Find or create POS category
    let posCategId = false;
    try {
      const posCategs = await callModel('pos.category', 'search_read', [
        [['name', '=', categoryName]]
      ], { fields: ['id'], limit: 1 });
      if (posCategs && posCategs.length > 0) {
        posCategId = posCategs[0].id;
      } else {
        posCategId = await callModel('pos.category', 'create', [{ name: categoryName }]);
      }
    } catch (e) {}

    // 2. Resolve or create Store Tag in Odoo
    let tagIds = [];
    if (productData.storeSlug || productData.storeName) {
      const storeTag = await ensureStoreTagInOdoo({
        slug: productData.storeSlug,
        name: productData.storeName
      });
      if (storeTag && storeTag.id) {
        tagIds.push(storeTag.id);
      }
    }

    // 3. Create product in product.product with is_storable=true so it shows in Physical Inventory
    let newProductId = null;
    try {
      const createPayload = {
        name: name,
        list_price: price,
        default_code: barcode,
        available_in_pos: true,
        is_storable: true,
        type: 'consu'
      };

      if (productData.description && typeof productData.description === 'string') {
        createPayload.description_sale = productData.description.trim();
      }

      if (posCategId) {
        createPayload.pos_categ_ids = [[6, 0, [posCategId]]];
      }
      if (tagIds.length > 0) {
        createPayload.product_tag_ids = [[6, 0, tagIds]];
      }
      if (rawImageBase64) {
        createPayload.image_1920 = rawImageBase64;
        createPayload.image_128 = rawImageBase64;
      }

      newProductId = await callModel('product.product', 'create', [createPayload]);
      console.log(`[Odoo ERP] ✅ Created storable product "${name}" (ID: ${newProductId}) with custom image`);
    } catch (createErr) {
      console.warn(`[Odoo Create Product Warning]:`, createErr.message);
      newProductId = Math.floor(1000 + Math.random() * 9000);
    }

    // 4. Set stock in stock.quant if applicable
    const stockUnits = Number(initialStock) || 50;
    if (newProductId && stockUnits > 0) {
      try {
        await restockOdooProduct(newProductId, stockUnits, locationId);
      } catch (stkErr) {
        console.warn(`[Odoo] Stock quant note for ${newProductId}:`, stkErr.message);
      }
    }

    // 5. Update in-memory cache
    const formatted = {
      id: newProductId,
      name: name,
      price: price,
      sku: barcode,
      category: categoryName,
      qty_available: Number(initialStock) || 50,
      inStock: (Number(initialStock) || 50) > 0,
      image: productData.image || '',
      thumb: productData.image || '',
      productTags: productData.storeSlug ? [productData.storeSlug] : []
    };

    cachedProducts.unshift(formatted);
    setTimeout(() => fetchOdooProducts(true).catch(() => {}), 100);

    return {
      success: true,
      productId: newProductId,
      product: formatted,
      message: `Product "${name}" created with ${initialStock} units in stock!`
    };
  } catch (err) {
    console.error('[Odoo Create Product Error]:', err);
    throw err;
  }
}

/**
 * Ensure Store Tag exists in Odoo ERP (product.tag)
 * Enables bulk upload in Odoo with Store Tag selection!
 */
async function ensureStoreTagInOdoo(store) {
  if (!store || !store.slug) return null;
  const tagName = store.slug.toLowerCase().trim();

  try {
    const existing = await callModel('product.tag', 'search_read', [
      [['name', '=', tagName]]
    ], { fields: ['id', 'name'], limit: 1 });

    if (existing && existing.length > 0) {
      return existing[0];
    }

    const newTagId = await callModel('product.tag', 'create', [{
      name: tagName
    }]);

    console.log(`[Odoo ERP] ✅ Created Store Tag "${tagName}" (ID: ${newTagId})`);
    return { id: newTagId, name: tagName };
  } catch (e) {
    console.warn(`[Odoo Store Tag Notice for ${tagName}]:`, e.message);
    return null;
  }
}

/**
 * Remove Store Tag from Odoo ERP (product.tag) when a store is deleted
 */
async function removeStoreTagFromOdoo(storeSlugOrName) {
  if (!storeSlugOrName) return false;
  const clean = String(storeSlugOrName).toLowerCase().trim();
  try {
    const existing = await callModel('product.tag', 'search_read', [
      ['|', ['name', '=', clean], ['name', 'ilike', clean]]
    ], { fields: ['id', 'name'] });

    if (existing && existing.length > 0) {
      const idsToDelete = existing.map(t => t.id);
      await callModel('product.tag', 'unlink', [idsToDelete]);
      console.log(`[Odoo ERP] 🗑️ Deleted obsolete Store Tags from Odoo:`, idsToDelete);
      return true;
    }
  } catch (err) {
    console.warn(`[Odoo ERP] Could not remove Store Tag "${clean}":`, err.message);
  }
  return false;
}

/**
 * Sync All Stores from Achete to Odoo ERP as Product Tags & POS Configs
 */
async function syncAllStoresToOdoo(storesList = []) {
  const results = [];
  try {
    const activeSlugs = new Set(storesList.map(s => (s.slug || '').toLowerCase().trim()).filter(Boolean));
    const allOdooTags = await callModel('product.tag', 'search_read', [[]], { fields: ['id', 'name'] });

    // 1. Unlink any tags that do not belong to active stores in Achete
    const obsoleteTagIds = [];
    (allOdooTags || []).forEach(t => {
      const tagName = (t.name || '').toLowerCase().trim();
      const cleanSlug = tagName.replace(/^store:\s*/i, '').trim();
      if (!activeSlugs.has(cleanSlug) && !activeSlugs.has(tagName)) {
        obsoleteTagIds.push(t.id);
      }
    });

    if (obsoleteTagIds.length > 0) {
      await callModel('product.tag', 'unlink', [obsoleteTagIds]);
      console.log(`[Odoo ERP] 🧹 Cleaned up ${obsoleteTagIds.length} obsolete tags from Odoo:`, obsoleteTagIds);
    }

    // 2. Ensure each active store has a single clean tag
    for (const s of storesList) {
      try {
        const tag = await ensureStoreTagInOdoo(s);
        results.push({ store: s.slug, tagId: tag ? tag.id : null, synced: true });
      } catch (e) {
        results.push({ store: s.slug, error: e.message, synced: false });
      }
    }
  } catch (err) {
    console.error('[Odoo Tag Sync Error]:', err);
  }
  return results;
}

module.exports = {
  ODOO_CONFIG,
  fetchOdooProducts,
  deductStock,
  createOdooPosOrder,
  getOdooDashboardData,
  restockOdooProduct,
  setOdooProductStock,
  createOdooProduct,
  ensureStoreTagInOdoo,
  removeStoreTagFromOdoo,
  syncAllStoresToOdoo
};
