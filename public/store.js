/**
 * CORE SHARED STORE ENGINE & MULTI-CLIENT ODOO POS + WHATSAPP SYNC
 * Pure native execution, sub-millisecond responsiveness, zero clutter
 */

const NOVA = (function () {
  'use strict';

  // Helper to extract store slug from URL pathname (e.g., /abcstore -> abcstore)
  function getActiveStoreSlug() {
    const path = window.location.pathname.replace(/^\/|\/$/g, '');
    const parts = path.split('/');
    const first = parts[0];
    
    // 1. Check if path is a known static page or store slug
    if (first && first !== 'index.html' && first !== 'cart' && first !== 'cart.html' && first !== 'confirmation' && first !== 'confirmation.html' && first !== 'dashboard' && first !== 'dashboard.html' && first !== 'odoo_preview.html' && first !== 'admin') {
      try {
        localStorage.setItem('achete_active_store_slug', first);
      } catch (e) {}
      return first;
    }

    // 2. Query param ?store=kodastore
    const params = new URLSearchParams(window.location.search);
    const qStore = params.get('store');
    if (qStore) {
      try {
        localStorage.setItem('achete_active_store_slug', qStore);
      } catch (e) {}
      return qStore;
    }

    // 3. Saved store slug from previous navigation
    try {
      const saved = localStorage.getItem('achete_active_store_slug');
      if (saved && saved !== 'undefined' && saved !== 'null' && saved !== 'achete' && saved !== 'novamart') {
        return saved;
      }
    } catch (e) {}

    return 'kodastore';
  }

  const currentSlug = getActiveStoreSlug();

  let activeStore = {
    name: 'KODA STORE',
    slug: currentSlug || 'kodastore',
    logo: 'assets/products/logo.png',
    tagline: 'Official Store | Fast Delivery in Dar es Salaam',
    address: 'Masaki, Dar es Salaam',
    whatsapp: '+255710459064'
  };

  const SEED_PRODUCTS = [
    {
      id: 141,
      name: 'Samsung Galaxy S26 Ultra',
      category: 'Smartphones',
      price: 1850000,
      description: 'Latest Samsung Galaxy S26 Ultra flagship with dynamic AMOLED display, 200MP camera, and S-Pen.',
      rating: 4.9,
      reviews: 38,
      image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="24" fill="%230284c7"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="96" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">S</text></svg>',
      thumb: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="24" fill="%230284c7"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="96" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">S</text></svg>',
      qty_available: 25,
      inStock: true,
      barcode: 'SKU-S26U',
      default_code: 'SKU-S26U',
      type: 'consu',
      tags: ['kodastore', 'benstore', 'xyzstore']
    },
    {
      id: 140,
      name: 'iPhone 18 Pro Max Titanium',
      category: 'Smartphones',
      price: 5000000,
      description: 'Apple iPhone 18 Pro Max with Grade 5 Titanium body, A19 Pro chip, and periscope optical zoom.',
      rating: 5.0,
      reviews: 45,
      image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="24" fill="%23081735"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="96" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">IP</text></svg>',
      thumb: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="24" fill="%23081735"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="96" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">IP</text></svg>',
      qty_available: 15,
      inStock: true,
      barcode: 'SKU-IP18PM',
      default_code: 'SKU-IP18PM',
      type: 'consu',
      tags: ['kodastore', 'benstore', 'achete']
    },
    {
      id: 145,
      name: 'Samsung 45W USB-C Fast Charger',
      category: 'Accessories',
      price: 45000,
      description: 'Original Super Fast Charging 2.0 Power Adapter for Samsung Galaxy and USB-C devices.',
      rating: 4.8,
      reviews: 62,
      image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="24" fill="%23059669"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="96" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">FC</text></svg>',
      thumb: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="24" fill="%23059669"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="96" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">FC</text></svg>',
      qty_available: 40,
      inStock: true,
      barcode: 'SKU-45W-CHG',
      default_code: 'SKU-45W-CHG',
      type: 'consu',
      tags: ['kodastore', 'benstore', 'xyzstore', 'crownshop']
    },
    {
      id: 142,
      name: 'Apple AirPods Pro 2 USB-C',
      category: 'Audio',
      price: 650000,
      description: 'Active Noise Cancellation, Adaptive Audio, and MagSafe Charging Case with USB-C.',
      rating: 4.9,
      reviews: 29,
      image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="24" fill="%237c3aed"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="96" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">AP</text></svg>',
      thumb: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="24" fill="%237c3aed"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="96" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">AP</text></svg>',
      qty_available: 18,
      inStock: true,
      barcode: 'SKU-APP2',
      default_code: 'SKU-APP2',
      type: 'consu',
      tags: ['kodastore', 'benstore', 'xyzstore']
    },
    {
      id: 143,
      name: 'Sony WH-1000XM5 Wireless ANC Headphones',
      category: 'Audio',
      price: 950000,
      description: 'Industry leading noise cancelling wireless Bluetooth headphones with crystal clear hands-free calling.',
      rating: 4.9,
      reviews: 19,
      image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="24" fill="%23081735"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="96" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">WH</text></svg>',
      thumb: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="24" fill="%23081735"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="96" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">WH</text></svg>',
      qty_available: 12,
      inStock: true,
      barcode: 'SKU-WH1000XM5',
      default_code: 'SKU-WH1000XM5',
      type: 'consu',
      tags: ['kodastore', 'benstore', 'crownshop']
    },
    {
      id: 144,
      name: 'Anker PowerCore 20,000mAh 65W',
      category: 'Accessories',
      price: 180000,
      description: 'Ultra-high capacity fast charging power bank for laptops, tablets, and smartphones.',
      rating: 4.8,
      reviews: 31,
      image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="24" fill="%230284c7"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="96" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">PB</text></svg>',
      thumb: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="24" fill="%230284c7"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="96" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">PB</text></svg>',
      qty_available: 30,
      inStock: true,
      barcode: 'SKU-ANKER-65W',
      default_code: 'SKU-ANKER-65W',
      type: 'consu',
      tags: ['kodastore', 'benstore', 'xyzstore']
    }
  ];

  let liveProducts = [...SEED_PRODUCTS];
  let liveCategories = ['All', 'Smartphones', 'Accessories', 'Audio'];

  // Default initial cart starts at ZERO items
  const DEFAULT_CART = {};

  const DEFAULT_ORDER = {
    orderId: 'ACH-1048',
    totalPaid: 0,
    subtotal: 0,
    discount: 0,
    itemCount: 0,
    phone: '+255 7XX XXX XXX',
    items: [],
    status: 'Order Placed & Synced with Odoo',
    date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  };

  function getCartKey() {
    return `nova_cart_${currentSlug}`;
  }

  function getOrderKey() {
    return `nova_order_${currentSlug}`;
  }

  // LocalStorage Cart
  function getCart() {
    try {
      const stored = localStorage.getItem(getCartKey());
      if (stored !== null) return JSON.parse(stored);
    } catch (e) {}
    return { ...DEFAULT_CART };
  }

  function saveCart(cart) {
    try {
      localStorage.setItem(getCartKey(), JSON.stringify(cart));
    } catch (e) {}
  }

  function getLatestOrder() {
    try {
      const stored = localStorage.getItem(getOrderKey());
      if (stored) return JSON.parse(stored);
      const globalStored = localStorage.getItem('nova_latest_order');
      if (globalStored) return JSON.parse(globalStored);
    } catch (e) {}
    return { ...DEFAULT_ORDER };
  }

  function saveLatestOrder(order) {
    try {
      localStorage.setItem(getOrderKey(), JSON.stringify(order));
      localStorage.setItem('nova_latest_order', JSON.stringify(order));
    } catch (e) {}
  }

  function getPhone() {
    try {
      const stored = localStorage.getItem('nova_mart_phone');
      if (stored) return stored;
    } catch (e) {}
    return '+255 712 345 678';
  }

  function savePhone(phone) {
    try {
      localStorage.setItem('nova_mart_phone', phone);
    } catch (e) {}
  }

  function formatTZS(amount) {
    return 'TZS ' + Number(amount || 0).toLocaleString('en-US');
  }

  function calculateTotals(cart = getCart()) {
    let subtotal = 0;
    let itemCount = 0;
    let totalUnits = 0;

    for (const [id, qty] of Object.entries(cart)) {
      if (qty > 0) {
        const prod = liveProducts.find(p => String(p.id) === String(id));
        if (prod) {
          subtotal += prod.price * qty;
          itemCount++;
          totalUnits += qty;
        }
      }
    }

    let discount = 0;
    if (subtotal >= 15000) {
      discount = 1500;
    } else if (subtotal > 0) {
      discount = Math.min(Math.round(subtotal * 0.1), 1000);
    }

    const total = Math.max(0, subtotal - discount);

    return {
      subtotal,
      discount,
      total,
      itemCount,
      totalUnits
    };
  }

  // Rewrite all internal links to preserve store context
  function rewriteStoreLinks() {
    const isCustomSlug = currentSlug && currentSlug !== 'achete' && currentSlug !== 'novamart' && currentSlug !== 'shop';
    const storePrefix = isCustomSlug ? `/${currentSlug}` : '';
    const queryParam = isCustomSlug ? `?store=${currentSlug}` : '';

    // Cart links
    document.querySelectorAll('a[href="cart.html"], a[href="/cart"], a#btnHeaderCart, a#mobileFloatingCart').forEach(el => {
      el.href = isCustomSlug ? `/${currentSlug}/cart` : 'cart.html';
    });

    // Home / Shop links
    document.querySelectorAll('a[href="index.html"], a[href="/"], a.brand-block, a.nav-link[href="index.html"], a.cart-heading-link, .btn-outline-continue, #btnContinueShopping').forEach(el => {
      el.href = isCustomSlug ? `/${currentSlug}` : '/shop';
    });
  }

  // Load Products for this Store from Server
  async function loadOdooProducts(force = false) {
    try {
      let url = `/api/${currentSlug}/products?refresh=${force}`;
      let res = await fetch(url);
      
      if (!res.ok) {
        res = await fetch(`/api/odoo/products?refresh=${force}`);
      }

      if (res.ok) {
        const data = await res.json();
        if (data.store) {
          activeStore = { ...activeStore, ...data.store };
          applyStoreBranding(activeStore);
        }
        if (data.products) {
          liveProducts = data.products;
        }
        if (data.categories) {
          liveCategories = data.categories;
        }
        rewriteStoreLinks();
        return { products: liveProducts, categories: liveCategories, store: activeStore };
      }
    } catch (err) {
      console.warn('[Store Fetch Note]:', err.message);
    }
    rewriteStoreLinks();
    return { products: liveProducts, categories: liveCategories, store: activeStore };
  }

  // Apply Store Branding (Name, Logo, Location)
  function applyStoreBranding(store) {
    if (!store) return;
    
    // Page Title
    document.title = `${store.name || 'Store'} — Online Catalog`;

    // Brand Name Elements
    document.querySelectorAll('.brand-name').forEach(el => {
      el.textContent = store.name || 'Store';
    });

    // Modal Titles
    document.querySelectorAll('.modal-title-group h3').forEach(el => {
      el.textContent = store.name || 'Store';
    });

    // Location
    if (store.address) {
      document.querySelectorAll('.brand-location span:first-of-type').forEach(el => {
        el.textContent = store.address.split(',')[0] || store.address;
      });
    }

    // Logo Image
    if (store.logo) {
      document.querySelectorAll('.brand-logo-circle').forEach(circle => {
        circle.innerHTML = '';
        const img = document.createElement('img');
        img.className = 'brand-logo-img';
        img.alt = '';
        img.src = store.logo;
        circle.appendChild(img);
      });
    }

    rewriteStoreLinks();
  }

  // Update Cart Quantity
  function updateItemQty(id, delta) {
    const cart = getCart();
    const strId = String(id);
    const current = cart[strId] || 0;
    const prod = liveProducts.find(p => String(p.id) === strId);

    if (delta > 0 && prod && prod.qty_available !== undefined) {
      if (current + delta > prod.qty_available && prod.qty_available > 0) {
        showToast(`⚠️ Only ${prod.qty_available} units available in stock!`, 'danger');
        return cart;
      }
    }

    const next = Math.max(0, current + delta);
    if (next === 0) {
      delete cart[strId];
    } else {
      cart[strId] = next;
    }

    saveCart(cart);
    updateHeaderCartBadge();
    return cart;
  }

  function removeItem(id) {
    const cart = getCart();
    delete cart[String(id)];
    saveCart(cart);
    updateHeaderCartBadge();
    return cart;
  }

  function resetCart() {
    saveCart({});
    updateHeaderCartBadge();
  }

  // Header Badge Sync
  function updateHeaderCartBadge() {
    const totals = calculateTotals();
    const badgeCountEl = document.getElementById('headerCartBadge');
    const floatBadgeEl = document.getElementById('mobileFloatBadge');
    const mobileFloatingCart = document.getElementById('mobileFloatingCart');

    if (badgeCountEl) badgeCountEl.textContent = totals.itemCount;
    if (floatBadgeEl) floatBadgeEl.textContent = totals.itemCount;

    if (mobileFloatingCart) {
      if (totals.itemCount > 0) {
        mobileFloatingCart.style.display = 'flex';
      } else {
        mobileFloatingCart.style.display = 'none';
      }
    }
  }

  // Toast System
  function showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${type === 'danger' ? '#ef4444' : '#22c55e'}" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 2400);
  }

  // Submit Order directly to Server -> Odoo POS + Direct WhatsApp Dispatch
  async function submitOrderToOdoo(orderPayload) {
    try {
      orderPayload.storeSlug = currentSlug || 'kodastore';
      if (activeStore && activeStore.whatsapp) {
        orderPayload.storeWhatsapp = activeStore.whatsapp;
      } else {
        orderPayload.storeWhatsapp = '+255710459064';
      }
      if (activeStore && activeStore.name) {
        orderPayload.storeName = activeStore.name;
      } else {
        orderPayload.storeName = 'Koda Store';
      }
      const res = await fetch('/api/odoo/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('[Order Submission Error]:', err);
      return { success: false, error: err.message };
    }
  }

  function setItemQty(productId, targetQty) {
    const current = getCart()[String(productId)] || 0;
    const delta = Number(targetQty) - current;
    return updateItemQty(productId, delta);
  }

  return {
    getStoreSlug: () => currentSlug,
    getStore: () => activeStore,
    getProducts: () => liveProducts,
    getCategories: () => liveCategories,
    loadOdooProducts,
    applyStoreBranding,
    rewriteStoreLinks,
    getCart,
    saveCart,
    getLatestOrder,
    saveLatestOrder,
    getPhone,
    savePhone,
    formatTZS,
    calculateTotals,
    updateItemQty,
    setItemQty,
    removeItem,
    resetCart,
    updateHeaderCartBadge,
    showToast,
    submitOrderToOdoo
  };
})();
