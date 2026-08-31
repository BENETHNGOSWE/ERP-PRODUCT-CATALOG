/**
 * NOVA MART — Core Shared State & Odoo POS Live Integration
 * High performance, sub-millisecond execution, real-time Odoo stock sync
 */

const NOVA = (function () {
  'use strict';

  // Fallback initial catalog matching Odoo POS
  const DEFAULT_PRODUCTS = [
    {
      id: 167,
      odooId: 167,
      name: 'Coca-Cola 500ml',
      price: 1000,
      qty_available: 46,
      category: 'Drinks',
      image: 'assets/products/coca_cola.png',
      thumb: 'assets/products/coca_thumb.png',
      unit: '500ml',
      inStock: true
    },
    {
      id: 168,
      odooId: 168,
      name: 'Azam Juice 500ml',
      price: 1500,
      qty_available: 39,
      category: 'Drinks',
      image: 'assets/products/azam_juice.png',
      thumb: 'assets/products/azam_thumb.png',
      unit: '500ml (Mango)',
      inStock: true
    },
    {
      id: 169,
      odooId: 169,
      name: 'Mineral Water 500ml',
      price: 700,
      qty_available: 60,
      category: 'Drinks',
      image: 'assets/products/mineral_water.png',
      thumb: 'assets/products/mineral_water.png',
      unit: '500ml (Uhai)',
      inStock: true
    },
    {
      id: 170,
      odooId: 170,
      name: 'Nivea Body Lotion',
      price: 12000,
      qty_available: 24,
      category: 'Cosmetics',
      image: 'assets/products/nivea_lotion.png',
      thumb: 'assets/products/nivea_thumb.png',
      unit: 'Soft Moisturizing',
      inStock: true
    },
    {
      id: 171,
      odooId: 171,
      name: 'Samsung Charger',
      price: 25000,
      qty_available: 30,
      category: 'Electronics',
      image: 'assets/products/samsung_charger.png',
      thumb: 'assets/products/samsung_charger.png',
      unit: 'Fast Adapter + Cable',
      inStock: true
    },
    {
      id: 172,
      odooId: 172,
      name: 'MWANZA RICE 1kg',
      price: 3500,
      qty_available: 45,
      category: 'Food',
      image: 'assets/products/mwanza_rice.png',
      thumb: 'assets/products/mwanza_rice.png',
      unit: '1kg Premium Grain',
      inStock: true
    }
  ];

  // Default initial cart starts at ZERO items
  const DEFAULT_CART = {};

  const DEFAULT_ORDER = {
    orderId: 'NM-1048',
    totalPaid: 0,
    subtotal: 0,
    discount: 0,
    itemCount: 0,
    phone: '+255 7XX XXX XXX',
    items: [],
    status: 'Order Received',
    odooStatus: 'Confirmed in Odoo POS',
    date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  };

  let liveProducts = [...DEFAULT_PRODUCTS];
  let liveCategories = ['All', 'Drinks', 'Food', 'Cosmetics', 'Electronics', 'Household'];
  let isLiveConnected = false;

  // LocalStorage Cart
  function getCart() {
    try {
      const stored = localStorage.getItem('nova_mart_cart');
      if (stored !== null) return JSON.parse(stored);
    } catch (e) {}
    return { ...DEFAULT_CART };
  }

  function saveCart(cart) {
    try {
      localStorage.setItem('nova_mart_cart', JSON.stringify(cart));
    } catch (e) {}
  }

  function getLatestOrder() {
    try {
      const stored = localStorage.getItem('nova_mart_order');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return { ...DEFAULT_ORDER };
  }

  function saveLatestOrder(order) {
    try {
      localStorage.setItem('nova_mart_order', JSON.stringify(order));
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
        const prod = liveProducts.find(p => String(p.id) === String(id)) || DEFAULT_PRODUCTS.find(p => String(p.id) === String(id));
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

  // Fetch Live Products from Odoo API
  async function loadOdooProducts(force = false) {
    try {
      const res = await fetch(`/api/odoo/products?force=${force}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success && data.products && data.products.length > 0) {
        liveProducts = data.products;
        if (data.categories && data.categories.length > 0) {
          liveCategories = data.categories;
        }
        isLiveConnected = true;
        updateOdooStatusIndicator(true);
        return { products: liveProducts, categories: liveCategories };
      }
    } catch (err) {
      console.warn('[Odoo Live Fetch Note]: Using cached products', err.message);
      updateOdooStatusIndicator(false);
    }
    return { products: liveProducts, categories: liveCategories };
  }

  function updateOdooStatusIndicator(connected) {
    const badge = document.getElementById('odooLiveStatusBadge');
    if (badge) {
      if (connected) {
        badge.innerHTML = `
          <span class="fast-dot"></span>
          <span>Odoo POS Live Connected &bull; Real-time Stock</span>
        `;
        badge.className = 'fast-tag odoo-connected';
      } else {
        badge.innerHTML = `
          <span class="fast-dot" style="background:#f59e0b;"></span>
          <span>Odoo POS Syncing...</span>
        `;
        badge.className = 'fast-tag';
      }
    }
  }

  // Update Cart Quantity
  function updateItemQty(id, delta) {
    const cart = getCart();
    const strId = String(id);
    const current = cart[strId] || 0;
    const prod = liveProducts.find(p => String(p.id) === strId) || DEFAULT_PRODUCTS.find(p => String(p.id) === strId);

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
    const labelEl = document.getElementById('headerCartLabel');
    const floatBadgeEl = document.getElementById('mobileFloatBadge');
    const floatLabelEl = document.getElementById('mobileFloatLabel');
    const mobileFloatingCart = document.getElementById('mobileFloatingCart');

    const countText = totals.itemCount === 1 ? '1 Item' : `${totals.itemCount} Items`;

    if (badgeCountEl) badgeCountEl.textContent = totals.itemCount;
    if (labelEl) {
      labelEl.innerHTML = `${countText} &bull; ${formatTZS(totals.subtotal)}`;
    }
    if (floatBadgeEl) floatBadgeEl.textContent = totals.itemCount;
    if (floatLabelEl) {
      floatLabelEl.innerHTML = `${countText} &bull; ${formatTZS(totals.subtotal)}`;
    }

    // On mobile, show floating cart pill only when at least 1 item is selected
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

  // Submit Order directly to Odoo POS
  async function submitOrderToOdoo(orderPayload) {
    try {
      const res = await fetch('/api/odoo/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('[Odoo Order Error]:', err);
      return { success: false, error: err.message };
    }
  }

  return {
    getProducts: () => liveProducts,
    getCategories: () => liveCategories,
    loadOdooProducts,
    getCart,
    saveCart,
    getLatestOrder,
    saveLatestOrder,
    getPhone,
    savePhone,
    formatTZS,
    calculateTotals,
    updateItemQty,
    removeItem,
    resetCart,
    updateHeaderCartBadge,
    showToast,
    submitOrderToOdoo
  };
})();
