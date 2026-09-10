/**
 * MULTI-CLIENT STORE MANAGEMENT & PERSISTENCE ENGINE
 * 
 * Manages personalized client storefronts with guaranteed brand persistence:
 * - Dual-layer persistent storage (data/stores.json + data/stores.persistent.json + data/stores_backup.json)
 * - Self-healing asset storage (data/uploads/ <-> public/assets/stores/)
 * - Smart non-destructive Git deployment merge (never wipes registered client shops, logos, or banners)
 * - Dynamic high-res fallback SVG signboard generator for 100% uptime branding
 * - Unique slug validation, PIN auth, product & POS isolation
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.ACHETE_DATA_DIR || process.env.DATA_DIR || path.join(__dirname, 'data');
const STORES_FILE = path.join(DATA_DIR, 'stores.json');
const PERSISTENT_FILE = path.join(DATA_DIR, 'stores.persistent.json');
const BACKUP_FILE = path.join(DATA_DIR, 'stores_backup.json');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const ASSETS_STORES_DIR = path.join(__dirname, 'public', 'assets', 'stores');

// Ensure essential persistence directories exist
[DATA_DIR, UPLOADS_DIR, ASSETS_STORES_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {}
  }
});

/**
 * Save Base64 Image to persistent storage and public assets folder
 */
function saveBase64ToFile(base64Data, fileNamePrefix) {
  if (!base64Data || typeof base64Data !== 'string') {
    return base64Data;
  }
  // Keep raw SVG text data URIs as they are lightweight and 100% self-contained
  if (base64Data.startsWith('data:image/svg+xml;utf8') || base64Data.startsWith('data:image/svg+xml;charset=utf-8')) {
    return base64Data;
  }
  if (!base64Data.startsWith('data:image/')) {
    return base64Data;
  }
  try {
    const parts = base64Data.split(';base64,');
    if (parts.length === 2) {
      const mime = parts[0].split(':')[1] || '';
      const ext = mime.includes('png') ? 'png' : (mime.includes('svg') ? 'svg' : (mime.includes('webp') ? 'webp' : 'jpg'));
      const filename = `${fileNamePrefix}.${ext}`;
      const buffer = Buffer.from(parts[1], 'base64');

      // 1. Save to public assets for fast static web delivery
      const publicPath = path.join(ASSETS_STORES_DIR, filename);
      fs.writeFileSync(publicPath, buffer);

      // 2. Save mirror copy to persistent data/uploads directory (never lost on Git update)
      const persistentUploadPath = path.join(UPLOADS_DIR, filename);
      fs.writeFileSync(persistentUploadPath, buffer);

      return `/assets/stores/${filename}?v=${Date.now()}`;
    }
  } catch (err) {
    console.warn('[Asset Persistence Note]:', err.message);
  }
  return base64Data;
}

/**
 * Restore any missing asset files from persistent data/uploads to public/assets/stores
 */
function restoreUploadedAssets() {
  try {
    if (fs.existsSync(UPLOADS_DIR)) {
      const files = fs.readdirSync(UPLOADS_DIR);
      files.forEach(file => {
        const src = path.join(UPLOADS_DIR, file);
        const dest = path.join(ASSETS_STORES_DIR, file);
        if (fs.existsSync(src) && !fs.existsSync(dest)) {
          fs.copyFileSync(src, dest);
        }
      });
    }
  } catch (e) {
    console.warn('[Asset Restore Notice]:', e.message);
  }
}

/**
 * Dynamic High-Resolution Branded Signboard Generator
 */
function generateDynamicStoreBanner(name, themeColor, tagline) {
  const storeName = (name || 'STORE').toUpperCase().trim();
  const initial = storeName.charAt(0) || 'S';
  const color = themeColor || '#7433df';
  const sub = (tagline || 'Official Online Store • Fast Local Delivery').trim();
  
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="250" viewBox="0 0 1500 250"><rect width="1500" height="250" fill="%230f172a"/><defs><linearGradient id="bgG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%25" stop-color="%231e1b4b"/><stop offset="50%25" stop-color="%230f172a"/><stop offset="100%25" stop-color="%23180d2b"/></linearGradient></defs><rect width="1500" height="250" fill="url(%23bgG)"/><rect x="25" y="25" width="1450" height="200" rx="14" fill="%231e293b" stroke="%23334155" stroke-width="2"/><rect x="50" y="45" width="70" height="70" rx="12" fill="${encodeURIComponent(color)}"/><text x="85" y="93" font-family="-apple-system,BlinkMacSystemFont,Inter,Arial,sans-serif" font-weight="900" font-size="46" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">${encodeURIComponent(initial)}</text><text x="140" y="82" font-family="-apple-system,BlinkMacSystemFont,Inter,Arial,sans-serif" font-weight="900" font-size="44" fill="%23ffffff" letter-spacing="1.5">${encodeURIComponent(storeName)}</text><text x="140" y="116" font-family="-apple-system,BlinkMacSystemFont,Inter,Arial,sans-serif" font-weight="500" font-size="18" fill="%2394a3b8">${encodeURIComponent(sub)}</text><line x1="50" y1="160" x2="1450" y2="160" stroke="%23334155" stroke-width="1.5"/><circle cx="70" cy="188" r="5" fill="%2322c55e"/><text x="86" y="193" font-family="-apple-system,BlinkMacSystemFont,Inter,Arial,sans-serif" font-weight="700" font-size="15" fill="%2322c55e">OPEN FOR ORDERS &bull; VERIFIED MERCHANT</text></svg>`;
}

function sanitizeImageUrl(name, img) {
  if (img && typeof img === 'string' && img.length > 5 && !img.includes('"') && !img.includes('\n') && (img.startsWith('data:image/') || img.startsWith('http://') || img.startsWith('https://') || img.startsWith('/'))) {
    return img;
  }
  const initial = (name || 'P').trim().charAt(0).toUpperCase();
  const bgColors = ['#7433df', '#081735', '#059669', '#7c3aed', '#d97706', '#dc2626', '#0284c7'];
  const colorIndex = (name || 'P').charCodeAt(0) % bgColors.length;
  const bgColor = bgColors[colorIndex];
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="24" fill="${encodeURIComponent(bgColor)}"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="96" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">${initial}</text></svg>`;
}

// Default Seed Stores (Only used if no existing store records exist anywhere)
const DEFAULT_SEED_STORES = [
  {
    id: 9,
    name: 'Koda Store',
    slug: 'kodastore',
    tagline: 'Official Koda Store | Premium Tech & Essentials',
    logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" rx="16" fill="%23081735"/><text x="50%" y="54%" fill="white" font-size="24" font-weight="bold" text-anchor="middle" dominant-baseline="middle">KODA</text></svg>',
    whatsapp: '+255710459064',
    status: 'active',
    themeColor: '#7433df',
    currency: 'TZS',
    address: 'Masaki, Dar es Salaam, Tanzania',
    posConfigId: 1,
    posConfigName: 'Website Orders',
    categories: ['All', 'Smartphones', 'Accessories', 'Audio'],
    productKeywords: [],
    productIds: [141, 140, 145, 142, 143, 144, 146, 150, 148],
    createdDate: '2026-09-07',
    pin: '1234',
    inventoryOverrides: {},
    customProducts: [],
    banner: '/assets/stores/koda-store-banner.jpg'
  },
  {
    id: 10,
    name: 'Ben Store',
    slug: 'benstore',
    tagline: 'Genuine iPhones, Samsungs & Smart Accessories',
    logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" rx="16" fill="%237433df"/><text x="50%" y="54%" fill="white" font-size="28" font-weight="bold" text-anchor="middle" dominant-baseline="middle">BEN</text></svg>',
    whatsapp: '+255710459064',
    status: 'active',
    themeColor: '#7433df',
    currency: 'TZS',
    address: 'Kariakoo / City Mall, Dar es Salaam',
    posConfigId: 26,
    posConfigName: 'Website Orders',
    categories: ['All', 'Smartphones', 'Accessories', 'Audio'],
    productKeywords: [],
    productIds: [143, 140, 141, 144, 147, 149, 150],
    createdDate: '2026-09-09',
    pin: '1234',
    inventoryOverrides: {},
    customProducts: [],
    banner: '/assets/stores/simukitaa-banner.jpg'
  }
];

class StoreManager {
  constructor() {
    this.stores = [];
    this.loadStores();
  }

  /**
   * Smart Multi-Source Loading & Merging Engine
   * Ensures client shops, uploaded banners, logos, and customizations survive any Git update
   */
  loadStores() {
    restoreUploadedAssets();

    let primaryStores = [];
    let persistentStores = [];
    let backupStores = [];

    // 1. Read Primary Store File
    try {
      if (fs.existsSync(STORES_FILE)) {
        const raw = fs.readFileSync(STORES_FILE, 'utf8');
        primaryStores = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[StoreManager] Note reading primary stores:', e.message);
    }

    // 2. Read Persistent Store File (Secondary redundant copy)
    try {
      if (fs.existsSync(PERSISTENT_FILE)) {
        const raw = fs.readFileSync(PERSISTENT_FILE, 'utf8');
        persistentStores = JSON.parse(raw);
      }
    } catch (e) {}

    // 3. Read Backup Store File
    try {
      if (fs.existsSync(BACKUP_FILE)) {
        const raw = fs.readFileSync(BACKUP_FILE, 'utf8');
        backupStores = JSON.parse(raw);
      }
    } catch (e) {}

    // Smart Merge: Start with Persistent > Primary > Backup > Seed
    const storeMap = new Map();

    const mergeStoreIntoMap = (s) => {
      if (!s || (!s.id && !s.slug)) return;
      const key = String(s.slug || s.id).toLowerCase();
      const existing = storeMap.get(key);
      if (!existing) {
        storeMap.set(key, { ...s });
      } else {
        // Preserve user customizations (non-empty banner, custom logo, PIN, overrides, products)
        storeMap.set(key, {
          ...existing,
          ...s,
          banner: (s.banner && s.banner.trim()) ? s.banner : existing.banner,
          logo: (s.logo && s.logo.trim()) ? s.logo : existing.logo,
          pin: s.pin || existing.pin || '1234',
          whatsapp: (s.whatsapp && !s.whatsapp.includes('12345678')) ? s.whatsapp : (existing.whatsapp || s.whatsapp),
          inventoryOverrides: { ...(existing.inventoryOverrides || {}), ...(s.inventoryOverrides || {}) },
          customProducts: Array.isArray(s.customProducts) && s.customProducts.length > 0 ? s.customProducts : (existing.customProducts || []),
          productIds: Array.isArray(s.productIds) && s.productIds.length > 0 ? s.productIds : (existing.productIds || [])
        });
      }
    };

    // Merge in priority order
    DEFAULT_SEED_STORES.forEach(mergeStoreIntoMap);
    backupStores.forEach(mergeStoreIntoMap);
    primaryStores.forEach(mergeStoreIntoMap);
    persistentStores.forEach(mergeStoreIntoMap);

    this.stores = Array.from(storeMap.values());

    // Fallback self-healing: Ensure every store has a valid banner & logo
    this.stores.forEach(store => {
      if (!store.banner || store.banner.trim() === '') {
        store.banner = generateDynamicStoreBanner(store.name, store.themeColor, store.tagline);
      }
      if (!store.logo || store.logo.trim() === '') {
        const initial = (store.name || 'S').charAt(0).toUpperCase();
        store.logo = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" rx="16" fill="%237433df"/><text x="50%" y="54%" fill="white" font-size="28" font-weight="bold" text-anchor="middle" dominant-baseline="middle">${initial}</text></svg>`;
      }
    });

    // Save synchronized state to all persistence layers
    this.saveStores();
  }

  /**
   * Save Stores with Triple Redundancy (STORES_FILE, PERSISTENT_FILE, BACKUP_FILE)
   */
  saveStores() {
    try {
      const dataStr = JSON.stringify(this.stores, null, 2);
      fs.writeFileSync(STORES_FILE, dataStr, 'utf8');
      fs.writeFileSync(PERSISTENT_FILE, dataStr, 'utf8');
      fs.writeFileSync(BACKUP_FILE, dataStr, 'utf8');
    } catch (err) {
      console.error('[StoreManager] Error saving stores to persistent files:', err);
    }
  }

  getAllStores() {
    return this.stores;
  }

  getActiveStores() {
    return this.stores.filter(s => s.status === 'active');
  }

  getStoreBySlug(slug) {
    if (!slug) return null;
    const clean = slug.trim().toLowerCase();
    let direct = this.stores.find(s => s.slug.toLowerCase() === clean);
    
    // Alias support for legacy 'novamart' or 'achete'
    if (!direct && clean === 'novamart') {
      direct = this.stores.find(s => s.slug.toLowerCase() === 'achete') || this.stores[0];
    }
    if (!direct && clean === 'achete') {
      direct = this.stores.find(s => s.slug.toLowerCase() === 'novamart') || this.stores[0];
    }

    if (direct && (!direct.banner || direct.banner.trim() === '')) {
      direct.banner = generateDynamicStoreBanner(direct.name, direct.themeColor, direct.tagline);
    }
    return direct || null;
  }

  getStoreById(id) {
    const num = parseInt(id, 10);
    const store = this.stores.find(s => s.id === num) || null;
    if (store && (!store.banner || store.banner.trim() === '')) {
      store.banner = generateDynamicStoreBanner(store.name, store.themeColor, store.tagline);
    }
    return store;
  }

  validateSlug(slug, excludeId = null) {
    if (!slug || typeof slug !== 'string') {
      return { valid: false, error: 'Shop slug is required.' };
    }
    const clean = slug.trim().toLowerCase();
    const regex = /^[a-z0-9_-]{2,35}$/;
    if (!regex.test(clean)) {
      return { valid: false, error: 'Slug must be 2-35 characters, containing only letters, numbers, and dashes (e.g. abcstore).' };
    }
    const existing = this.stores.find(s => s.slug.toLowerCase() === clean && s.id !== excludeId);
    if (existing) {
      return { valid: false, error: `Slug "${clean}" is already taken by another store.` };
    }
    return { valid: true, slug: clean };
  }

  createStore(data) {
    const slugCheck = this.validateSlug(data.slug);
    if (!slugCheck.valid) {
      throw new Error(slugCheck.error);
    }

    const nextId = this.stores.reduce((max, s) => Math.max(max, s.id || 0), 0) + 1;
    
    // Default logo generator if none provided
    let logo = data.logo;
    if (!logo) {
      const initial = (data.name || 'S').charAt(0).toUpperCase();
      const color = data.themeColor || '#7433df';
      logo = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="16" fill="${encodeURIComponent(color)}"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="32" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">${initial}</text></svg>`;
    } else {
      logo = saveBase64ToFile(logo, `store-${nextId}-logo`);
    }

    let banner = data.banner;
    if (banner && banner.trim()) {
      banner = saveBase64ToFile(banner, `store-${nextId}-banner`);
    } else {
      banner = generateDynamicStoreBanner(data.name, data.themeColor, data.tagline);
    }

    const newStore = {
      id: nextId,
      name: (data.name || 'New Client Store').trim(),
      slug: slugCheck.slug,
      pin: data.pin || '1234',
      tagline: (data.tagline || 'Official Online Store').trim(),
      logo: logo,
      banner: banner,
      whatsapp: (data.whatsapp || '+255710459064').trim(),
      status: data.status === 'inactive' ? 'inactive' : 'active',
      themeColor: data.themeColor || '#7433df',
      currency: data.currency || 'TZS',
      address: data.address || 'Dar es Salaam, Tanzania',
      posConfigId: Number(data.posConfigId) || 26,
      posConfigName: data.posConfigName || 'Website Orders',
      categories: Array.isArray(data.categories) && data.categories.length > 0 ? data.categories : ['General'],
      productKeywords: Array.isArray(data.productKeywords) ? data.productKeywords : [],
      productIds: Array.isArray(data.productIds) ? data.productIds : [],
      inventoryOverrides: {},
      customProducts: [],
      createdDate: new Date().toISOString().substring(0, 10)
    };

    this.stores.push(newStore);
    this.saveStores();
    return newStore;
  }

  updateStore(idOrSlug, data) {
    let store = null;
    if (!isNaN(Number(idOrSlug))) {
      store = this.getStoreById(Number(idOrSlug));
    }
    if (!store) {
      store = this.getStoreBySlug(String(idOrSlug));
    }
    if (!store) {
      throw new Error(`Store not found: ${idOrSlug}`);
    }

    if (data.slug && data.slug !== store.slug) {
      const slugCheck = this.validateSlug(data.slug, store.id);
      if (!slugCheck.valid) {
        throw new Error(slugCheck.error);
      }
      store.slug = slugCheck.slug;
    }

    if (data.name) store.name = data.name.trim();
    if (data.pin) store.pin = String(data.pin).trim();
    if (data.tagline !== undefined) store.tagline = data.tagline.trim();
    if (data.logo) {
      store.logo = saveBase64ToFile(data.logo, `store-${store.id}-logo`);
    }
    if (data.banner !== undefined) {
      store.banner = saveBase64ToFile(data.banner, `store-${store.id}-banner`);
    }
    if (data.whatsapp) store.whatsapp = data.whatsapp.trim();
    if (data.status) store.status = data.status;
    if (data.themeColor) store.themeColor = data.themeColor;
    if (data.address) store.address = data.address;
    if (data.posConfigId) store.posConfigId = Number(data.posConfigId);
    if (data.posConfigName) store.posConfigName = data.posConfigName;

    if (Array.isArray(data.categories)) store.categories = data.categories;
    if (Array.isArray(data.productKeywords)) store.productKeywords = data.productKeywords;
    if (Array.isArray(data.productIds)) store.productIds = data.productIds;
    if (data.inventoryOverrides) {
      store.inventoryOverrides = { ...(store.inventoryOverrides || {}), ...data.inventoryOverrides };
    }

    this.saveStores();
    return store;
  }

  deleteStore(idOrSlug) {
    const idx = this.stores.findIndex(s => 
      s.id === Number(idOrSlug) || s.slug.toLowerCase() === String(idOrSlug).toLowerCase()
    );
    if (idx === -1) {
      throw new Error(`Store not found: ${idOrSlug}`);
    }
    const removed = this.stores.splice(idx, 1)[0];
    this.saveStores();
    return removed;
  }

  /**
   * Filter and Isolate Products Strictly for a Given Store
   */
  filterProductsForStore(allProducts = [], store) {
    if (!store) return allProducts;

    const matched = [];

    // 1. Match products directly assigned by Product ID
    if (Array.isArray(store.productIds) && store.productIds.length > 0) {
      const idSet = new Set(store.productIds.map(Number));
      allProducts.forEach(p => {
        if (idSet.has(Number(p.id))) {
          matched.push({ ...p });
        }
      });
    }

    // 2. Match products tagged with this store's slug or name in Odoo ERP
    const storeSlug = (store.slug || '').toLowerCase();
    const storeName = (store.name || '').toLowerCase();
    allProducts.forEach(p => {
      const alreadyIn = matched.some(m => Number(m.id) === Number(p.id));
      if (!alreadyIn) {
        const pTags = Array.isArray(p.tags) ? p.tags.map(t => String(t).toLowerCase()) : [];
        if (pTags.includes(storeSlug) || pTags.includes(storeName) || (p.store_slug && p.store_slug.toLowerCase() === storeSlug)) {
          matched.push({ ...p });
        }
      }
    });

    // 3. Match by Product Keywords if specified
    if (Array.isArray(store.productKeywords) && store.productKeywords.length > 0) {
      const keywords = store.productKeywords.map(k => k.toLowerCase().trim()).filter(Boolean);
      const byKeywords = allProducts.filter(p => {
        const pName = (p.name || '').toLowerCase();
        const pCat = (p.category || '').toLowerCase();
        return keywords.some(k => pName.includes(k) || pCat.includes(k));
      });
      byKeywords.forEach(p => {
        if (!matched.some(m => Number(m.id) === Number(p.id))) {
          matched.push({ ...p });
        }
      });
    }

    // 4. Merge store's custom created products (Strictly avoiding duplicates by ID or Name)
    if (Array.isArray(store.customProducts) && store.customProducts.length > 0) {
      store.customProducts.forEach(cp => {
        const cpName = (cp.name || '').trim().toLowerCase();
        const alreadyExists = matched.some(p => 
          Number(p.id) === Number(cp.id) || 
          ((p.name || '').trim().toLowerCase() === cpName && cpName.length > 0)
        );
        if (!alreadyExists) {
          matched.push({ ...cp });
        }
      });
    }

    // 5. Final Deduplication Pass by ID and Name
    const uniqueMap = new Map();
    matched.forEach(p => {
      const key = `${p.id}_${(p.name || '').trim().toLowerCase()}`;
      if (!uniqueMap.has(key) && !uniqueMap.has(String(p.id))) {
        uniqueMap.set(key, p);
        uniqueMap.set(String(p.id), p);
      }
    });
    const uniqueProducts = Array.from(new Set(uniqueMap.values()));

    // 6. Apply Store-Specific Isolated Stock & Pricing Overrides
    const overrides = store.inventoryOverrides || {};
    return uniqueProducts.map(prod => {
      const pId = String(prod.id);
      const ovr = overrides[pId];

      const isCustomStoreProd = Array.isArray(store.customProducts) && store.customProducts.some(cp => Number(cp.id) === Number(prod.id));
      const baseStock = Number(prod.qty_available !== undefined ? prod.qty_available : (prod.stock || 0));

      // Real-time stock parity: For Odoo products, live Odoo ERP qty_available is authoritative across all screens
      const storeStock = (!isCustomStoreProd && prod.qty_available !== undefined)
        ? Number(prod.qty_available)
        : (ovr && ovr.qty_available !== undefined ? Number(ovr.qty_available) : baseStock);

      const storePrice = ovr && ovr.price !== undefined ? Number(ovr.price) : Number(prod.price || prod.list_price || 0);

      return {
        ...prod,
        name: ovr?.name || prod.name,
        price: storePrice,
        description: ovr?.description || prod.description || '',
        image: ovr?.image || prod.image,
        thumb: ovr?.image || prod.thumb || prod.image,
        qty_available: storeStock,
        inStock: storeStock > 0,
        isStoreCustomized: Boolean(ovr) || isCustomStoreProd,
        storeStock: storeStock,
        storePrice: storePrice
      };
    });
  }

  /**
   * Get stock on hand for a specific product in a specific store
   */
  getStoreProductStock(idOrSlug, productId) {
    const store = !isNaN(Number(idOrSlug)) ? this.getStoreById(Number(idOrSlug)) : this.getStoreBySlug(String(idOrSlug));
    if (!store) return { qty_available: 50, inStock: true };

    const pIdStr = String(productId);
    const pIdNum = Number(productId);

    // 1. Check custom products
    if (Array.isArray(store.customProducts)) {
      const custom = store.customProducts.find(p => Number(p.id) === pIdNum);
      if (custom && custom.qty_available !== undefined) {
        return {
          qty_available: Number(custom.qty_available) || 0,
          inStock: (Number(custom.qty_available) || 0) > 0
        };
      }
    }

    // 2. Check store inventory overrides
    if (store.inventoryOverrides && store.inventoryOverrides[pIdStr]) {
      const ovr = store.inventoryOverrides[pIdStr];
      if (ovr.qty_available !== undefined) {
        return {
          qty_available: Number(ovr.qty_available) || 0,
          inStock: (Number(ovr.qty_available) || 0) > 0
        };
      }
    }

    return { qty_available: 50, inStock: true };
  }

  /**
   * Update stock and/or price specifically for this store
   */
  updateStoreProductStock(idOrSlug, productId, { addQty, newQty, price, name, description }) {
    const store = !isNaN(Number(idOrSlug)) ? this.getStoreById(Number(idOrSlug)) : this.getStoreBySlug(String(idOrSlug));
    if (!store) throw new Error(`Store not found: ${idOrSlug}`);

    if (!store.inventoryOverrides) store.inventoryOverrides = {};
    if (!Array.isArray(store.productIds)) store.productIds = [];

    const pIdStr = String(productId);
    const pIdNum = Number(productId);

    if (!store.productIds.includes(pIdNum)) {
      store.productIds.push(pIdNum);
    }

    // Check if it's in store.customProducts
    if (Array.isArray(store.customProducts)) {
      const customProd = store.customProducts.find(p => Number(p.id) === pIdNum);
      if (customProd) {
        if (addQty !== undefined && addQty !== null && !isNaN(Number(addQty))) {
          customProd.qty_available = Math.max(0, (Number(customProd.qty_available) || 0) + Number(addQty));
        } else if (newQty !== undefined && newQty !== null && !isNaN(Number(newQty))) {
          customProd.qty_available = Math.max(0, Number(newQty));
        }
        if (price !== undefined && price !== null && !isNaN(Number(price))) {
          customProd.price = Number(price);
        }
        if (name) customProd.name = name.trim();
        if (description !== undefined) customProd.description = description.trim();
        customProd.inStock = (Number(customProd.qty_available) || 0) > 0;
        customProd.updatedAt = new Date().toISOString();

        this.saveStores();
        return { store, product: customProd };
      }
    }

    // Otherwise update or create entry in inventoryOverrides
    const existing = store.inventoryOverrides[pIdStr] || {};
    let finalQty = existing.qty_available !== undefined ? Number(existing.qty_available) : 0;

    if (addQty !== undefined && addQty !== null && !isNaN(Number(addQty))) {
      finalQty = Math.max(0, finalQty + Number(addQty));
    } else if (newQty !== undefined && newQty !== null && !isNaN(Number(newQty))) {
      finalQty = Math.max(0, Number(newQty));
    }

    let finalPrice = existing.price !== undefined ? Number(existing.price) : undefined;
    if (price !== undefined && price !== null && !isNaN(Number(price))) {
      finalPrice = Number(price);
    }

    store.inventoryOverrides[pIdStr] = {
      ...existing,
      qty_available: finalQty,
      ...(finalPrice !== undefined ? { price: finalPrice } : {}),
      ...(name ? { name: name.trim() } : {}),
      ...(description !== undefined ? { description: description.trim() } : {}),
      updatedAt: new Date().toISOString()
    };

    this.saveStores();
    return {
      store,
      override: store.inventoryOverrides[pIdStr],
      productId: pIdNum
    };
  }

  /**
   * Add a brand new custom product directly to this client's store
   */
  addCustomProductToStore(idOrSlug, data) {
    const store = !isNaN(Number(idOrSlug)) ? this.getStoreById(Number(idOrSlug)) : this.getStoreBySlug(String(idOrSlug));
    if (!store) throw new Error(`Store not found: ${idOrSlug}`);

    if (!Array.isArray(store.customProducts)) store.customProducts = [];
    if (!Array.isArray(store.productIds)) store.productIds = [];

    const nextId = Math.max(
      1000,
      ...store.customProducts.map(p => Number(p.id) || 0),
      ...store.productIds.map(Number)
    ) + 1;

    const initialStock = Number(data.initialStock || data.qty_available || data.stock || 0);
    const prodImg = sanitizeImageUrl(data.name, data.image || data.thumb);
    const newProd = {
      id: nextId,
      name: (data.name || 'New Store Product').trim(),
      category: (data.category || 'General').trim(),
      price: Number(data.price) || 0,
      description: (data.description || '').trim(),
      qty_available: initialStock,
      inStock: initialStock > 0,
      image: prodImg,
      thumb: prodImg,
      default_code: (data.sku || data.default_code || `SKU-${nextId}`).trim(),
      barcode: data.barcode || '',
      type: 'consu',
      rating: 5.0,
      reviews: 1,
      createdAt: new Date().toISOString()
    };

    store.customProducts.push(newProd);
    if (!store.productIds.includes(nextId)) {
      store.productIds.push(nextId);
    }

    this.saveStores();
    return { store, product: newProd };
  }

  /**
   * Deduct store-specific stock when an order is placed for this store
   */
  deductStoreStock(idOrSlug, items = []) {
    const store = !isNaN(Number(idOrSlug)) ? this.getStoreById(Number(idOrSlug)) : this.getStoreBySlug(String(idOrSlug));
    if (!store || !items || items.length === 0) return;

    if (!store.inventoryOverrides) store.inventoryOverrides = {};
    if (!Array.isArray(store.customProducts)) store.customProducts = [];

    items.forEach(item => {
      const pIdNum = Number(item.id || item.productId);
      const pIdStr = String(pIdNum);
      const qtyToDeduct = Number(item.quantity || item.qty || 1);

      // 1. Check customProducts
      const customProd = store.customProducts.find(p => Number(p.id) === pIdNum);
      if (customProd) {
        customProd.qty_available = Math.max(0, (Number(customProd.qty_available) || 0) - qtyToDeduct);
        customProd.inStock = customProd.qty_available > 0;
        return;
      }

      // 2. Check or initialize inventoryOverrides
      const existing = store.inventoryOverrides[pIdStr];
      const baseQty = existing && existing.qty_available !== undefined
        ? Number(existing.qty_available)
        : Number(item.qty_available !== undefined ? item.qty_available : (item.stock || 50));
      const finalQty = Math.max(0, baseQty - qtyToDeduct);

      store.inventoryOverrides[pIdStr] = {
        ...(existing || {}),
        qty_available: finalQty,
        updatedAt: new Date().toISOString()
      };
    });

    this.saveStores();
  }

  assignProductsToStore(idOrSlug, productIds) {
    const store = !isNaN(Number(idOrSlug)) ? this.getStoreById(Number(idOrSlug)) : this.getStoreBySlug(String(idOrSlug));
    if (!store) throw new Error(`Store not found: ${idOrSlug}`);

    store.productIds = Array.from(new Set((productIds || []).map(Number)));
    this.saveStores();
    console.log(`[StoreManager] Assigned ${store.productIds.length} products to store "${store.name}"`);
    return store;
  }

  addProductToStore(idOrSlug, productId) {
    const store = !isNaN(Number(idOrSlug)) ? this.getStoreById(Number(idOrSlug)) : this.getStoreBySlug(String(idOrSlug));
    if (!store) throw new Error(`Store not found: ${idOrSlug}`);

    if (!Array.isArray(store.productIds)) store.productIds = [];
    const numId = Number(productId);
    if (!store.productIds.includes(numId)) {
      store.productIds.push(numId);
      this.saveStores();
    }
    return store;
  }

  removeProductFromStore(idOrSlug, productId) {
    const store = !isNaN(Number(idOrSlug)) ? this.getStoreById(Number(idOrSlug)) : this.getStoreBySlug(String(idOrSlug));
    if (!store) throw new Error(`Store not found: ${idOrSlug}`);

    if (Array.isArray(store.productIds)) {
      store.productIds = store.productIds.filter(id => Number(id) !== Number(productId));
      this.saveStores();
    }
    return store;
  }
}

module.exports = new StoreManager();
