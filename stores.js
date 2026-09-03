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
   * Filter Odoo Products strictly for this Client Store
   * Enforces strict Product Separation & Stock Loading Guard
   */
  filterProductsForStore(allProducts, store) {
    if (!store || !allProducts || allProducts.length === 0) return [];

    // 1. Explicit Product IDs match (Highest precedence)
    if (Array.isArray(store.productIds) && store.productIds.length > 0) {
      const idSet = new Set(store.productIds.map(Number));
      return allProducts.filter(p => idSet.has(p.id));
    }

    // 2. Built-in default stores use curated keywords/categories
    const isBuiltinStore = [1, 2, 3, 4].includes(store.id) || ['abcstore', 'novamart', 'crownshop', 'safaridiner'].includes(store.slug);
    
    if (isBuiltinStore) {
      const storeCategories = (store.categories || []).map(c => c.toLowerCase());
      const storeKeywords = (store.productKeywords || []).map(k => k.toLowerCase());

      return allProducts.filter(p => {
        const pName = (p.name || '').toLowerCase();
        const pCat = (p.category || '').toLowerCase();
        const pSku = (p.default_code || '').toLowerCase();

        const catMatch = storeCategories.some(sc => pCat.includes(sc) || sc.includes(pCat));
        if (catMatch) return true;

        const keyMatch = storeKeywords.some(kw => pName.includes(kw) || pSku.includes(kw));
        if (keyMatch) return true;

        return false;
      });
    }

    // 3. For newly created user stores:
    // If the store has specific productKeywords configured by user, filter by those keywords
    if (Array.isArray(store.productKeywords) && store.productKeywords.length > 0) {
      const storeKeywords = store.productKeywords.map(k => k.toLowerCase().trim()).filter(Boolean);
      if (storeKeywords.length > 0) {
        return allProducts.filter(p => {
          const pName = (p.name || '').toLowerCase();
          const pSku = (p.default_code || '').toLowerCase();
          return storeKeywords.some(kw => pName.includes(kw) || pSku.includes(kw));
        });
      }
    }

    // 4. If no products/stock are loaded yet for this new store, return empty array (0 products)
    // Prevents unlinked new stores from displaying global/demo inventory unexpectedly!
    return [];
  }
}

module.exports = new StoreManager();
