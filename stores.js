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

const STORES_FILE = path.join(__dirname, 'data', 'stores.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
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
    posConfigId: 3, // Mangi shop in Odoo
    posConfigName: 'Mangi shop',
    categories: ['Food', 'Drinks', 'Household', 'Cosmetics', 'Electronics'],
    productKeywords: ['coca', 'azam', 'water', 'nivea', 'soap', 'dettol', 'rice', 'oil', 'charger', 'flour', 'bread', 'juice'],
    createdDate: '2026-08-15'
  },
  {
    id: 2,
    name: 'NOVA MART',
    slug: 'novamart',
    tagline: 'Industrial Safety Gear, PPE & Heavy Duty Workwear',
    logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="16" fill="%23081735"/><polygon points="40 16 18 52 38 52 36 68 62 32 42 32 40 16" fill="%2322c55e"/></svg>',
    whatsapp: '+255784112233',
    status: 'active',
    themeColor: '#081735',
    currency: 'TZS',
    address: 'Kariakoo Commercial Hub, Dar es Salaam',
    posConfigId: 26, // Website Orders in Odoo
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
    posConfigId: 4, // Min Market in Odoo
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
    posConfigId: 1, // Restaurant in Odoo
    posConfigName: 'Restaurant',
    categories: ['Food', 'Drinks', 'BULLY Menu', 'GGM Menu', 'Northmara Menu'],
    productKeywords: ['chicken', 'chips', 'mayai', 'juice', 'water', 'coca', 'food'],
    createdDate: '2026-08-25'
  }
];

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
    return this.stores.find(s => s.slug.toLowerCase() === clean) || null;
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
    if (!store) return [];

    let matched = [];

    // 1. Explicit Product IDs match (Highest precedence)
    if (Array.isArray(store.productIds) && store.productIds.length > 0) {
      const idSet = new Set(store.productIds.map(Number));
      matched = (allProducts || []).filter(p => idSet.has(Number(p.id)));
    } else {
      // 2. Built-in default stores use curated keywords/categories
      const isBuiltinStore = [1, 2, 3, 4].includes(store.id) || ['abcstore', 'novamart', 'crownshop', 'safaridiner'].includes(store.slug);
      
      if (isBuiltinStore) {
        const storeCategories = (store.categories || []).map(c => c.toLowerCase());
        const storeKeywords = (store.productKeywords || []).map(k => k.toLowerCase());

        matched = (allProducts || []).filter(p => {
          const pName = (p.name || '').toLowerCase();
          const pCat = (p.category || '').toLowerCase();
          const pSku = (p.default_code || '').toLowerCase();

          const catMatch = storeCategories.some(sc => pCat.includes(sc) || sc.includes(pCat));
          if (catMatch) return true;

          const keyMatch = storeKeywords.some(kw => pName.includes(kw) || pSku.includes(kw));
          if (keyMatch) return true;

          return false;
        });
      } else if (Array.isArray(store.productKeywords) && store.productKeywords.length > 0) {
        const storeKeywords = store.productKeywords.map(k => k.toLowerCase().trim()).filter(Boolean);
        if (storeKeywords.length > 0) {
          matched = (allProducts || []).filter(p => {
            const pName = (p.name || '').toLowerCase();
            const pSku = (p.default_code || '').toLowerCase();
            return storeKeywords.some(kw => pName.includes(kw) || pSku.includes(kw));
          });
        }
      }
    }

    // Clone matched list to avoid mutating shared Odoo cache
    const finalProducts = matched.map(p => ({ ...p }));

    // 3. Merge store's custom created products
    if (Array.isArray(store.customProducts) && store.customProducts.length > 0) {
      store.customProducts.forEach(cp => {
        if (!finalProducts.some(p => Number(p.id) === Number(cp.id))) {
          finalProducts.push({ ...cp });
        }
      });
    }

    // 4. Apply Store-Specific Isolated Stock & Pricing Overrides
    const overrides = store.inventoryOverrides || {};
    return finalProducts.map(prod => {
      const pId = String(prod.id);
      const ovr = overrides[pId];
      if (ovr) {
        const storeStock = ovr.qty_available !== undefined ? Number(ovr.qty_available) : Number(prod.qty_available || 0);
        const storePrice = ovr.price !== undefined ? Number(ovr.price) : Number(prod.price || 0);
        return {
          ...prod,
          name: ovr.name || prod.name,
          price: storePrice,
          qty_available: storeStock,
          inStock: storeStock > 0,
          isStoreCustomized: true,
          storeStock: storeStock,
          storePrice: storePrice
        };
      }
      return {
        ...prod,
        storeStock: Number(prod.qty_available || 0),
        storePrice: Number(prod.price || 0),
        inStock: Number(prod.qty_available || 0) > 0
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
  updateStoreProductStock(idOrSlug, productId, { addQty, newQty, price, name }) {
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
    const newProd = {
      id: nextId,
      name: (data.name || 'New Store Product').trim(),
      category: (data.category || 'General').trim(),
      price: Number(data.price) || 0,
      qty_available: initialStock,
      inStock: initialStock > 0,
      image: data.image || '/assets/products/samsung_charger.png',
      thumb: data.thumb || data.image || '/assets/products/samsung_charger.png',
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
