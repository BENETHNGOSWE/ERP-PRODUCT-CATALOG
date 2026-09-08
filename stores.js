/**
 * MULTI-CLIENT STORE MANAGEMENT MODULE
 * 
 * Manages personalized client storefronts:
 * - Unique slug validation (e.g. achete.me/abcstore)
 * - Branding & Logo per client
 * - WhatsApp number per client
 * - Product and POS isolation
 * - Store lifecycle (Active / Inactive)
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const STORES_FILE = path.join(DATA_DIR, 'stores.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Default Client Stores
const DEFAULT_STORES = [
  {
    id: 1,
    name: 'ABC Store',
    slug: 'abcstore',
    tagline: 'Your Daily Groceries, Snacks & Household Essentials',
    logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="16" fill="%230047bb"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="28" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">ABC</text></svg>',
    whatsapp: '+255712345678',
    status: 'active',
    themeColor: '#0047bb',
    currency: 'TZS',
    address: 'Masaki, Dar es Salaam, Tanzania',
    posConfigId: 4, // Mangi shop in Odoo
    posConfigName: 'Mangi shop',
    categories: ['Food', 'Drinks', 'Household', 'Cosmetics', 'Electronics'],
    productKeywords: ['coca', 'azam', 'water', 'nivea', 'soap', 'dettol', 'rice', 'oil', 'charger', 'flour', 'bread', 'juice'],
    createdDate: '2026-08-15'
  },
  {
    id: 2,
    name: 'ACHETE',
    slug: 'achete',
    tagline: 'Digital Storefront Platform | Fast Delivery in Dar es Salaam',
    logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="16" fill="%23081735"/><polygon points="40 16 18 52 38 52 36 68 62 32 42 32 40 16" fill="%2322c55e"/></svg>',
    whatsapp: '+255784112233',
    status: 'active',
    themeColor: '#081735',
    currency: 'TZS',
    address: 'Kariakoo Commercial Hub, Dar es Salaam',
    posConfigId: 1, // Website Orders in Odoo
    posConfigName: 'Website Orders',
    categories: ['Safety Gear', 'Head Protection', 'Eye Protection', 'Foot Protection', 'Body Protection', 'Respiratory Protection', 'Hand Protection'],
    productKeywords: ['boot', 'titanstep', 'helmet', 'arcguard', 'glasses', 'clearvision', 'respirator', 'forcefield', 'coverall', 'chembarrier', 'harness', 'glove'],
    createdDate: '2026-08-01'
  },
  {
    id: 3,
    name: 'Crown Shop',
    slug: 'crownshop',
    tagline: 'Premium Office Furniture, Electronics & Modern Appliances',
    logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="16" fill="%237c3aed"/><path d="M20 54 L20 30 L32 42 L40 22 L48 42 L60 30 L60 54 Z" fill="%23fbbf24"/></svg>',
    whatsapp: '+255755998877',
    status: 'active',
    themeColor: '#7c3aed',
    currency: 'TZS',
    address: 'Posta City Centre, Dar es Salaam',
    posConfigId: 5, // Min Market in Odoo
    posConfigName: 'Min Market',
    categories: ['Office Furniture', 'Kitchen materials', 'Equipments', 'Electronics'],
    productKeywords: ['desk', 'chair', 'cabinet', 'storage', 'utensils', 'mouse', 'lamp', 'stand', 'organizer'],
    createdDate: '2026-08-20'
  },
  {
    id: 4,
    name: 'Safari Diner & Cafe',
    slug: 'safaridiner',
    tagline: 'Fresh Chef Dishes, Local BBQ & Refreshing Beverages',
    logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="16" fill="%23d97706"/><circle cx="40" cy="40" r="22" fill="%23ffffff"/><text x="50%" y="54%" font-size="22" text-anchor="middle" dominant-baseline="middle">🍽️</text></svg>',
    whatsapp: '+255688554433',
    status: 'active',
    themeColor: '#d97706',
    currency: 'TZS',
    address: 'Oysterbay Peninsula, Dar es Salaam',
    posConfigId: 6, // Restaurant in Odoo
    posConfigName: 'Restaurant',
    categories: ['Food', 'Drinks', 'BULLY Menu', 'GGM Menu', 'Northmara Menu'],
    productKeywords: ['chicken', 'chips', 'mayai', 'juice', 'water', 'coca', 'food'],
    createdDate: '2026-08-25'
  },
  {
    id: 9,
    name: 'Koda Store',
    slug: 'kodastore',
    tagline: 'Official Koda Store | Premium Tech & Essentials',
    logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="16" fill="%23081735"/><text x="50%" y="54%" fill="white" font-size="24" font-weight="bold" text-anchor="middle" dominant-baseline="middle">KODA</text></svg>',
    whatsapp: '+255710459064',
    status: 'active',
    themeColor: '#0047bb',
    currency: 'TZS',
    address: 'Dar es Salaam, Tanzania',
    posConfigId: 1,
    posConfigName: 'Website Orders',
    categories: ['General', 'Electronics', 'Accessories'],
    productKeywords: ['charger', 'samsung', 'mouse'],
    createdDate: '2026-09-07'
  }
];

function sanitizeImageUrl(name, img) {
  if (img && typeof img === 'string' && img.length > 5 && !img.includes('"') && !img.includes('\n') && (img.startsWith('data:image/') || img.startsWith('http://') || img.startsWith('https://') || img.startsWith('/'))) {
    return img;
  }
  const initial = (name || 'P').trim().charAt(0).toUpperCase();
  const bgColors = ['#0047bb', '#081735', '#059669', '#7c3aed', '#d97706', '#dc2626', '#0284c7'];
  const colorIndex = (name || 'P').charCodeAt(0) % bgColors.length;
  const bgColor = bgColors[colorIndex];
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="24" fill="${encodeURIComponent(bgColor)}"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="96" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">${initial}</text></svg>`;
}

class StoreManager {
  constructor() {
    this.stores = [];
    this.loadStores();
  }

  loadStores() {
    try {
      if (fs.existsSync(STORES_FILE)) {
        const raw = fs.readFileSync(STORES_FILE, 'utf8');
        this.stores = JSON.parse(raw);
      } else {
        this.stores = DEFAULT_STORES;
        this.saveStores();
      }
    } catch (err) {
      console.error('[StoreManager] Error reading stores file, initializing defaults:', err);
      this.stores = DEFAULT_STORES;
    }
  }

  saveStores() {
    try {
      fs.writeFileSync(STORES_FILE, JSON.stringify(this.stores, null, 2), 'utf8');
    } catch (err) {
      console.error('[StoreManager] Error saving stores:', err);
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
    const direct = this.stores.find(s => s.slug.toLowerCase() === clean);
    if (direct) return direct;
    
    // Alias support for legacy 'novamart' or 'achete'
    if (clean === 'novamart') {
      return this.stores.find(s => s.slug.toLowerCase() === 'achete') || this.stores[0];
    }
    if (clean === 'achete') {
      return this.stores.find(s => s.slug.toLowerCase() === 'novamart') || this.stores[0];
    }
    return null;
  }

  getStoreById(id) {
    const num = parseInt(id, 10);
    return this.stores.find(s => s.id === num) || null;
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
      const color = data.themeColor || '#0047bb';
      logo = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="16" fill="${encodeURIComponent(color)}"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="32" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">${initial}</text></svg>`;
    }

    const newStore = {
      id: nextId,
      name: (data.name || 'New Client Store').trim(),
      slug: slugCheck.slug,
      pin: data.pin || '1234',
      tagline: (data.tagline || 'Official Online Store').trim(),
      logo: logo,
      whatsapp: (data.whatsapp || '+255712345678').trim(),
      status: data.status === 'inactive' ? 'inactive' : 'active',
      themeColor: data.themeColor || '#0047bb',
      currency: data.currency || 'TZS',
      address: data.address || 'Dar es Salaam, Tanzania',
      posConfigId: Number(data.posConfigId) || 26,
      posConfigName: data.posConfigName || 'Website Orders',
      categories: Array.isArray(data.categories) && data.categories.length > 0 ? data.categories : ['General'],
      productKeywords: Array.isArray(data.productKeywords) ? data.productKeywords : [],
      productIds: Array.isArray(data.productIds) ? data.productIds : [],
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
    if (data.logo) store.logo = data.logo;
    if (data.whatsapp) store.whatsapp = data.whatsapp.trim();
    if (data.status) store.status = data.status;
    if (data.themeColor) store.themeColor = data.themeColor;
    if (data.address) store.address = data.address;
    if (data.posConfigId) store.posConfigId = Number(data.posConfigId);
    if (data.posConfigName) store.posConfigName = data.posConfigName;
    if (data.categories) store.categories = Array.isArray(data.categories) ? data.categories : [data.categories];
    if (data.productKeywords) store.productKeywords = Array.isArray(data.productKeywords) ? data.productKeywords : [];
    if (data.productIds) store.productIds = Array.isArray(data.productIds) ? data.productIds : [];

    this.saveStores();
    return store;
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

  deleteStore(idOrSlug) {
    const index = this.stores.findIndex(s => s.id === Number(idOrSlug) || s.slug === idOrSlug);
    if (index === -1) {
      throw new Error('Store not found.');
    }
    const removed = this.stores.splice(index, 1)[0];
    this.saveStores();
    return removed;
  }

  /**
   * Filter and resolve products strictly for this Client Store with isolated stock & pricing
   * Enforces multi-client catalog separation, custom store stock, and store price overrides.
   */
  filterProductsForStore(allProducts = [], store) {
    if (!store) return allProducts;

    const isMasterStore = store.slug === 'achete' || store.slug === 'novamart' || !store.id;
    const storeSlug = (store.slug || '').toLowerCase();
    const storeName = (store.name || '').toLowerCase();
    let matched = [];

    // 1. Tag-Based Matching (Odoo Product Tags from bulk import / Odoo product form)
    const taggedProducts = (allProducts || []).filter(p => {
      const tags = (p.productTags || p.tags || []).map(t => String(t).toLowerCase());
      return tags.some(t => t === storeSlug || t === `store: ${storeName}` || t === `store: ${storeSlug}` || t.includes(storeSlug));
    });

    if (taggedProducts.length > 0) {
      matched = taggedProducts.map(p => ({ ...p }));
    }

    // 2. Explicit ID Assignment (store.productIds)
    if (Array.isArray(store.productIds) && store.productIds.length > 0) {
      const idSet = new Set(store.productIds.map(Number));
      const byId = (allProducts || []).filter(p => idSet.has(Number(p.id)));
      byId.forEach(p => {
        if (!matched.some(m => Number(m.id) === Number(p.id))) {
          matched.push({ ...p });
        }
      });
    }

    // 3. Keyword-Based Matching (store.productKeywords)
    if (Array.isArray(store.productKeywords) && store.productKeywords.length > 0) {
      const keywords = store.productKeywords.map(k => String(k).toLowerCase());
      const byKeywords = (allProducts || []).filter(p => {
        const pName = (p.name || '').toLowerCase();
        const pCat = (p.category || '').toLowerCase();
        const pDesc = (p.description || '').toLowerCase();
        return keywords.some(k => pName.includes(k) || pCat.includes(k) || pDesc.includes(k));
      });
      byKeywords.forEach(p => {
        if (!matched.some(m => Number(m.id) === Number(p.id))) {
          matched.push({ ...p });
        }
      });
    }

    // 4. Fallback: If no tags, explicit IDs, or keywords matched, match by store categories or master list
    if (matched.length === 0) {
      if (store.categories && store.categories.length > 0 && !store.categories.includes('All')) {
        const byCat = (allProducts || []).filter(p => store.categories.includes(p.category));
        if (byCat.length > 0) {
          matched = byCat.map(p => ({ ...p }));
        }
      }
      if (matched.length === 0) {
        matched = (allProducts || []).map(p => ({ ...p }));
      }
    }

    // 5. Merge store's custom created products
    if (Array.isArray(store.customProducts) && store.customProducts.length > 0) {
      store.customProducts.forEach(cp => {
        if (!matched.some(p => Number(p.id) === Number(cp.id))) {
          matched.push({ ...cp });
        }
      });
    }

    // 6. Apply Store-Specific Isolated Stock & Pricing Overrides
    const overrides = store.inventoryOverrides || {};
    return matched.map(prod => {
      const pId = String(prod.id);
      const ovr = overrides[pId];

      const isCustomStoreProd = Array.isArray(store.customProducts) && store.customProducts.some(cp => Number(cp.id) === Number(prod.id));
      const baseStock = Number(prod.qty_available !== undefined ? prod.qty_available : (prod.stock || 50));

      const storeStock = ovr && ovr.qty_available !== undefined ? Number(ovr.qty_available) : baseStock;
      const storePrice = ovr && ovr.price !== undefined ? Number(ovr.price) : Number(prod.price || 0);

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
   * Update stock and/or price specifically for this store
   * Supports:
   * - addQty (e.g. +10 received stock)
   * - newQty (exact stock count)
   * - price (store selling price)
   */
  updateStoreProductStock(idOrSlug, productId, { addQty, newQty, price, name, description }) {
    const store = !isNaN(Number(idOrSlug)) ? this.getStoreById(Number(idOrSlug)) : this.getStoreBySlug(String(idOrSlug));
    if (!store) throw new Error(`Store not found: ${idOrSlug}`);

    if (!store.inventoryOverrides) store.inventoryOverrides = {};
    if (!Array.isArray(store.productIds)) store.productIds = [];

    const pIdStr = String(productId);
    const pIdNum = Number(productId);

    // If product is not yet in store.productIds, add it
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
      const existing = store.inventoryOverrides[pIdStr] || { qty_available: 0 };
      const current = Number(existing.qty_available || 0);
      store.inventoryOverrides[pIdStr] = {
        ...existing,
        qty_available: Math.max(0, current - qtyToDeduct),
        updatedAt: new Date().toISOString()
      };
    });

    this.saveStores();
  }
}

module.exports = new StoreManager();
