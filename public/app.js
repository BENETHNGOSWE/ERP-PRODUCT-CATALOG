/**
 * NOVA MART — Ultra-Fast Single Page Web App
 * Pure native ES6+ with sub-millisecond execution & zero framework overhead
 */

(function () {
  'use strict';

  // --- 1. PRODUCT CATALOG DATA ---
  const PRODUCTS = [
    {
      id: 'prod-1',
      name: 'Coca-Cola 500ml',
      price: 1000,
      category: 'Drinks',
      image: 'assets/products/coca_cola.png',
      thumb: 'assets/products/coca_thumb.png',
      popularity: 100
    },
    {
      id: 'prod-2',
      name: 'Azam Juice 500ml',
      price: 1500,
      category: 'Drinks',
      image: 'assets/products/azam_juice.png',
      thumb: 'assets/products/azam_thumb.png',
      popularity: 95
    },
    {
      id: 'prod-3',
      name: 'Mineral Water 500ml',
      price: 700,
      category: 'Drinks',
      image: 'assets/products/mineral_water.png',
      thumb: 'assets/products/mineral_water.png',
      popularity: 90
    },
    {
      id: 'prod-4',
      name: 'Nivea Body Lotion',
      price: 12000,
      category: 'Cosmetics',
      image: 'assets/products/nivea_lotion.png',
      thumb: 'assets/products/nivea_thumb.png',
      popularity: 88
    },
    {
      id: 'prod-5',
      name: 'Samsung Charger',
      price: 25000,
      category: 'Electronics',
      image: 'assets/products/samsung_charger.png',
      thumb: 'assets/products/samsung_charger.png',
      popularity: 82
    },
    {
      id: 'prod-6',
      name: 'MWANZA RICE 1kg',
      price: 3500,
      category: 'Food',
      image: 'assets/products/mwanza_rice.png',
      thumb: 'assets/products/mwanza_rice.png',
      popularity: 85
    },
    {
      id: 'prod-7',
      name: 'Korie Cooking Oil 1L',
      price: 5500,
      category: 'Food',
      image: 'assets/products/cooking_oil.png',
      thumb: 'assets/products/cooking_oil.png',
      popularity: 80
    },
    {
      id: 'prod-8',
      name: 'Azam Wheat Flour 2kg',
      price: 3200,
      category: 'Food',
      image: 'assets/products/azam_flour.png',
      thumb: 'assets/products/azam_flour.png',
      popularity: 78
    },
    {
      id: 'prod-9',
      name: 'Dettol Original Soap',
      price: 2500,
      category: 'Cosmetics',
      image: 'assets/products/dettol_soap.png',
      thumb: 'assets/products/dettol_soap.png',
      popularity: 75
    },
    {
      id: 'prod-10',
      name: 'Asas Fresh Milk 1L',
      price: 2800,
      category: 'Drinks',
      image: 'assets/products/fresh_milk.png',
      thumb: 'assets/products/fresh_milk.png',
      popularity: 86
    },
    {
      id: 'prod-11',
      name: 'Oraimo FreePods 4',
      price: 45000,
      category: 'Electronics',
      image: 'assets/products/oraimo_earbuds.png',
      thumb: 'assets/products/oraimo_earbuds.png',
      popularity: 70
    },
    {
      id: 'prod-12',
      name: 'Sunlight Washing Powder 1kg',
      price: 4500,
      category: 'Household',
      image: 'assets/products/sunlight_detergent.png',
      thumb: 'assets/products/sunlight_detergent.png',
      popularity: 74
    }
  ];

  // --- 2. APPLICATION STATE ---
  const state = {
    // Initial cart matching image: 2x Coca-Cola, 1x Azam Juice, 1x Nivea Lotion
    cart: {
      'prod-1': 2,
      'prod-2': 1,
      'prod-4': 1
    },
    selectedCategory: 'All',
    searchQuery: '',
    sortBy: 'popular',
    customerPhone: '+255 712 345 678',
    currentOrder: {
      orderId: 'NM-1048',
      totalPaid: 14000,
      itemCount: 3,
      phone: '+255 712 345 678',
      status: 'Processing',
      timestamp: new Date()
    },
    activeViewMode: 'desktop', // 'desktop', 'mobile-flow', 'mobile-interactive'
    simActiveTab: 'products' // 'products', 'cart', 'confirmation'
  };

  // --- 3. FORMATTING HELPERS ---
  function formatTZS(amount) {
    return 'TZS ' + Number(amount).toLocaleString('en-US');
  }

  function calculateCartTotals() {
    let subtotal = 0;
    let itemCount = 0; // distinct items count

    for (const [prodId, qty] of Object.entries(state.cart)) {
      if (qty > 0) {
        const prod = PRODUCTS.find(p => p.id === prodId);
        if (prod) {
          subtotal += prod.price * qty;
          itemCount++;
        }
      }
    }

    // Dynamic discount: if subtotal >= 15,000 grant TZS 1,500 discount (as in mockup)
    let discount = 0;
    if (subtotal >= 15000) {
      discount = 1500;
    } else if (subtotal > 0 && subtotal < 15000) {
      discount = Math.min(Math.round(subtotal * 0.1), 1000);
    }

    const total = Math.max(0, subtotal - discount);

    return {
      subtotal,
      discount,
      total,
      itemCount
    };
  }

  // --- 4. RENDERERS ---

  // Render Desktop Products Grid
  function renderDesktopProducts() {
    const grid = document.getElementById('desktopProductGrid');
    if (!grid) return;

    const filtered = getFilteredProducts();

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #64748b;">
          <p style="font-size: 1.1rem; font-weight: 600;">No products found</p>
          <p style="font-size: 0.9rem; margin-top: 4px;">Try searching for something else or change category.</p>
        </div>
      `;
      return;
    }

    let html = '';
    filtered.forEach(p => {
      const qty = state.cart[p.id] || 0;
      html += `
        <article class="product-card" data-id="${p.id}">
          <div class="product-card-img-wrap">
            <img src="${p.image}" alt="${p.name}" class="product-card-img" loading="lazy">
          </div>
          <h3 class="product-card-title" title="${p.name}">${p.name}</h3>
          <div class="product-card-price">${formatTZS(p.price)}</div>
          <div class="stepper-control">
            <button class="stepper-btn btn-minus" data-id="${p.id}" aria-label="Decrease quantity">&minus;</button>
            <span class="stepper-val" id="qty-desk-${p.id}">${qty}</span>
            <button class="stepper-btn btn-plus" data-id="${p.id}" aria-label="Increase quantity">&#43;</button>
          </div>
        </article>
      `;
    });

    grid.innerHTML = html;
  }

  // Render Desktop Cart Table & Order Summary
  function renderDesktopCart() {
    const tbody = document.getElementById('cartTableBody');
    const subtotalEl = document.getElementById('summarySubtotal');
    const discountEl = document.getElementById('summaryDiscount');
    const totalEl = document.getElementById('summaryTotal');
    const headerCartBadge = document.getElementById('headerCartBadge');
    const headerCartLabel = document.getElementById('headerCartLabel');

    if (!tbody) return;

    const totals = calculateCartTotals();

    // Update Header Badge
    if (headerCartBadge) headerCartBadge.textContent = totals.itemCount;
    if (headerCartLabel) {
      headerCartLabel.innerHTML = `${totals.itemCount} Items &bull; ${formatTZS(totals.subtotal)}`;
    }

    // Update Order Summary
    if (subtotalEl) subtotalEl.textContent = formatTZS(totals.subtotal);
    if (discountEl) discountEl.textContent = totals.discount > 0 ? `- ${formatTZS(totals.discount)}` : 'TZS 0';
    if (totalEl) totalEl.textContent = formatTZS(totals.total);

    // Build Cart Table Rows
    const cartItems = Object.entries(state.cart).filter(([_, qty]) => qty > 0);

    if (cartItems.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center; padding: 30px; color: #64748b;">
            Your cart is currently empty. Add products from above!
          </td>
        </tr>
      `;
      return;
    }

    let rowsHtml = '';
    cartItems.forEach(([prodId, qty]) => {
      const p = PRODUCTS.find(prod => prod.id === prodId);
      if (!p) return;
      const rowSubtotal = p.price * qty;

      rowsHtml += `
        <tr data-id="${p.id}">
          <td class="cart-product-cell">
            <img src="${p.thumb || p.image}" alt="${p.name}" class="cart-item-thumb">
            <div class="cart-item-meta">
              <span class="cart-item-name">${p.name}</span>
              <span class="cart-item-unit-price">${formatTZS(p.price)} each</span>
            </div>
          </td>
          <td class="cart-price-cell">${formatTZS(p.price)}</td>
          <td class="cart-qty-cell">
            <div class="stepper-control">
              <button class="stepper-btn btn-minus" data-id="${p.id}" aria-label="Decrease">&minus;</button>
              <span class="stepper-val">${qty}</span>
              <button class="stepper-btn btn-plus" data-id="${p.id}" aria-label="Increase">&#43;</button>
            </div>
          </td>
          <td class="cart-subtotal-cell">${formatTZS(rowSubtotal)}</td>
          <td style="text-align: right;">
            <button class="cart-delete-btn" data-id="${p.id}" title="Remove item">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = rowsHtml;
  }

  // Render Confirmation Details
  function renderConfirmationDetails() {
    const { orderId, totalPaid, itemCount, phone } = state.currentOrder;

    // Desktop elements
    const confirmOrderNum = document.getElementById('confirmOrderNum');
    const confirmTotalPaid = document.getElementById('confirmTotalPaid');
    const confirmItemCount = document.getElementById('confirmItemCount');
    const confirmPhoneNum = document.getElementById('confirmPhoneNum');

    if (confirmOrderNum) confirmOrderNum.textContent = orderId;
    if (confirmTotalPaid) confirmTotalPaid.textContent = formatTZS(totalPaid);
    if (confirmItemCount) confirmItemCount.textContent = `${itemCount} items`;
    if (confirmPhoneNum) confirmPhoneNum.textContent = phone || '+255 712 345 678';

    // Mobile Flow elements (Phone 3)
    const p3Order = document.getElementById('phone3OrderNum');
    const p3Total = document.getElementById('phone3TotalPaid');
    const p3Items = document.getElementById('phone3ItemCount');
    const p3Phone = document.getElementById('phone3PhoneNum');

    if (p3Order) p3Order.textContent = orderId;
    if (p3Total) p3Total.textContent = formatTZS(totalPaid);
    if (p3Items) p3Items.textContent = `${itemCount} items`;
    if (p3Phone) p3Phone.textContent = phone || '+255 7XX XXX XXX';

    // Sim elements
    const simOrder = document.getElementById('simConfirmOrderNum');
    const simTotal = document.getElementById('simConfirmTotalPaid');
    const simItems = document.getElementById('simConfirmItemCount');
    const simPhone = document.getElementById('simConfirmPhoneNum');

    if (simOrder) simOrder.textContent = orderId;
    if (simTotal) simTotal.textContent = formatTZS(totalPaid);
    if (simItems) simItems.textContent = `${itemCount} items`;
    if (simPhone) simPhone.textContent = phone || '+255 712 345 678';
  }

  // Render Mobile Flow (Phone 1 products & Phone 2 cart)
  function renderMobileFlowViews() {
    // Phone 1 Grid
    const p1Grid = document.getElementById('phone1ProductGrid');
    const totals = calculateCartTotals();

    if (p1Grid) {
      const filtered = getFilteredProducts();
      let html = '';
      filtered.forEach(p => {
        const qty = state.cart[p.id] || 0;
        html += `
          <div class="product-card" data-id="${p.id}">
            <div class="product-card-img-wrap">
              <img src="${p.image}" alt="${p.name}" class="product-card-img">
            </div>
            <div class="product-card-title">${p.name}</div>
            <div class="product-card-price">${formatTZS(p.price)}</div>
            <div class="stepper-control">
              <button class="stepper-btn btn-minus" data-id="${p.id}">&minus;</button>
              <span class="stepper-val">${qty}</span>
              <button class="stepper-btn btn-plus" data-id="${p.id}">&#43;</button>
            </div>
          </div>
        `;
      });
      p1Grid.innerHTML = html;
    }

    // Phone 1 Floating Cart bar
    const p1Badge = document.getElementById('phone1Badge');
    const p1CartText = document.getElementById('phone1CartText');
    if (p1Badge) p1Badge.textContent = totals.itemCount;
    if (p1CartText) p1CartText.innerHTML = `${totals.itemCount} Items &bull; ${formatTZS(totals.subtotal)}`;

    // Phone 2 Cart list
    const p2List = document.getElementById('phone2CartList');
    const p2Subtotal = document.getElementById('phone2Subtotal');
    const p2Discount = document.getElementById('phone2Discount');
    const p2Total = document.getElementById('phone2Total');

    if (p2Subtotal) p2Subtotal.textContent = formatTZS(totals.subtotal);
    if (p2Discount) p2Discount.textContent = totals.discount > 0 ? `- ${formatTZS(totals.discount)}` : 'TZS 0';
    if (p2Total) p2Total.textContent = formatTZS(totals.total);

    if (p2List) {
      const cartItems = Object.entries(state.cart).filter(([_, qty]) => qty > 0);
      if (cartItems.length === 0) {
        p2List.innerHTML = `<div style="text-align:center; padding: 20px; color: #64748b; font-size: 0.85rem;">Cart is empty</div>`;
      } else {
        let html = '';
        cartItems.forEach(([prodId, qty]) => {
          const p = PRODUCTS.find(item => item.id === prodId);
          if (!p) return;
          const sub = p.price * qty;
          html += `
            <div class="m-cart-item-card" data-id="${p.id}">
              <img src="${p.thumb || p.image}" alt="${p.name}" class="m-item-thumb">
              <div class="m-item-details">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                  <div>
                    <div class="m-item-name">${p.name}</div>
                    <div class="m-item-unit">${formatTZS(p.price)} each</div>
                  </div>
                  <button class="m-item-trash cart-delete-btn" data-id="${p.id}" title="Remove">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
                <div class="m-item-row-bottom">
                  <div class="stepper-control" style="padding: 2px 4px;">
                    <button class="stepper-btn btn-minus" data-id="${p.id}" style="width:20px;height:20px;">&minus;</button>
                    <span class="stepper-val" style="font-size:0.8rem;">${qty}</span>
                    <button class="stepper-btn btn-plus" data-id="${p.id}" style="width:20px;height:20px;">&#43;</button>
                  </div>
                  <div class="m-item-subtotal">${formatTZS(sub)}</div>
                </div>
              </div>
            </div>
          `;
        });
        p2List.innerHTML = html;
      }
    }

    // Single Sim Views
    renderSimViews();
  }

  // Render Simulator Views
  function renderSimViews() {
    const simGrid = document.getElementById('simProductGrid');
    const simList = document.getElementById('simCartList');
    const simBadge = document.getElementById('simBadge');
    const simCartText = document.getElementById('simCartText');
    const simSubtotal = document.getElementById('simSubtotal');
    const simDiscount = document.getElementById('simDiscount');
    const simTotal = document.getElementById('simTotal');

    const totals = calculateCartTotals();

    if (simBadge) simBadge.textContent = totals.itemCount;
    if (simCartText) simCartText.innerHTML = `${totals.itemCount} Items &bull; ${formatTZS(totals.subtotal)}`;
    if (simSubtotal) simSubtotal.textContent = formatTZS(totals.subtotal);
    if (simDiscount) simDiscount.textContent = totals.discount > 0 ? `- ${formatTZS(totals.discount)}` : 'TZS 0';
    if (simTotal) simTotal.textContent = formatTZS(totals.total);

    if (simGrid) {
      const filtered = getFilteredProducts();
      let html = '';
      filtered.forEach(p => {
        const qty = state.cart[p.id] || 0;
        html += `
          <div class="product-card" data-id="${p.id}">
            <div class="product-card-img-wrap">
              <img src="${p.image}" alt="${p.name}" class="product-card-img">
            </div>
            <div class="product-card-title">${p.name}</div>
            <div class="product-card-price">${formatTZS(p.price)}</div>
            <div class="stepper-control">
              <button class="stepper-btn btn-minus" data-id="${p.id}">&minus;</button>
              <span class="stepper-val">${qty}</span>
              <button class="stepper-btn btn-plus" data-id="${p.id}">&#43;</button>
            </div>
          </div>
        `;
      });
      simGrid.innerHTML = html;
    }

    if (simList) {
      const cartItems = Object.entries(state.cart).filter(([_, qty]) => qty > 0);
      if (cartItems.length === 0) {
        simList.innerHTML = `<div style="text-align:center; padding: 20px; color: #64748b; font-size: 0.85rem;">Cart is empty</div>`;
      } else {
        let html = '';
        cartItems.forEach(([prodId, qty]) => {
          const p = PRODUCTS.find(item => item.id === prodId);
          if (!p) return;
          const sub = p.price * qty;
          html += `
            <div class="m-cart-item-card" data-id="${p.id}">
              <img src="${p.thumb || p.image}" alt="${p.name}" class="m-item-thumb">
              <div class="m-item-details">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                  <div>
                    <div class="m-item-name">${p.name}</div>
                    <div class="m-item-unit">${formatTZS(p.price)} each</div>
                  </div>
                  <button class="m-item-trash cart-delete-btn" data-id="${p.id}">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
                <div class="m-item-row-bottom">
                  <div class="stepper-control" style="padding: 2px 4px;">
                    <button class="stepper-btn btn-minus" data-id="${p.id}" style="width:20px;height:20px;">&minus;</button>
                    <span class="stepper-val" style="font-size:0.8rem;">${qty}</span>
                    <button class="stepper-btn btn-plus" data-id="${p.id}" style="width:20px;height:20px;">&#43;</button>
                  </div>
                  <div class="m-item-subtotal">${formatTZS(sub)}</div>
                </div>
              </div>
            </div>
          `;
        });
        simList.innerHTML = html;
      }
    }
  }

  // Filter & Sort Logic
  function getFilteredProducts() {
    return PRODUCTS.filter(p => {
      const matchCat = state.selectedCategory === 'All' || p.category === state.selectedCategory;
      const matchSearch = !state.searchQuery || p.name.toLowerCase().includes(state.searchQuery.toLowerCase());
      return matchCat && matchSearch;
    }).sort((a, b) => {
      if (state.sortBy === 'price-asc') return a.price - b.price;
      if (state.sortBy === 'price-desc') return b.price - a.price;
      if (state.sortBy === 'name-asc') return a.name.localeCompare(b.name);
      return b.popularity - a.popularity; // Default: popular
    });
  }

  // Master Synchronized Render
  function renderAll() {
    renderDesktopProducts();
    renderDesktopCart();
    renderMobileFlowViews();
    renderConfirmationDetails();
  }

  // --- 5. CART & INTERACTION ACTIONS ---
  function updateQuantity(prodId, delta) {
    const current = state.cart[prodId] || 0;
    const updated = Math.max(0, current + delta);
    
    if (updated === 0) {
      delete state.cart[prodId];
    } else {
      state.cart[prodId] = updated;
    }

    const prod = PRODUCTS.find(p => p.id === prodId);
    if (prod && delta > 0) {
      showToast(`Added ${prod.name} to cart`);
    }

    renderAll();
  }

  function removeFromCart(prodId) {
    const prod = PRODUCTS.find(p => p.id === prodId);
    delete state.cart[prodId];
    if (prod) {
      showToast(`Removed ${prod.name}`);
    }
    renderAll();
  }

  function clearCart() {
    state.cart = {};
    showToast('Cart cleared');
    renderAll();
  }

  function processCheckout() {
    const totals = calculateCartTotals();
    if (totals.itemCount === 0) {
      showToast('⚠️ Your cart is empty. Add products first!');
      return;
    }

    const phoneInput = document.getElementById('desktopPhoneInput')?.value || 
                       document.getElementById('phone2MobileInput')?.value || 
                       document.getElementById('simMobileInput')?.value || 
                       '+255 712 345 678';

    // Generate random Order ID like NM-1048
    const randId = 'NM-' + Math.floor(1000 + Math.random() * 9000);

    const orderItems = [];
    for (const [prodId, qty] of Object.entries(state.cart)) {
      if (qty > 0) {
        const p = PRODUCTS.find(prod => prod.id === prodId);
        if (p) {
          orderItems.push({
            id: p.id,
            name: p.name,
            price: p.price,
            qty: qty
          });
        }
      }
    }

    state.currentOrder = {
      orderId: randId,
      totalPaid: totals.total,
      itemCount: totals.itemCount,
      phone: phoneInput,
      status: 'Order Received',
      timestamp: new Date()
    };

    // Submit live to Odoo POS ERP
    fetch('/api/odoo/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: randId,
        customerPhone: phoneInput,
        customerName: `Customer (${phoneInput})`,
        items: orderItems,
        totalAmount: totals.total
      })
    }).then(res => res.json()).then(res => {
      console.log('[Odoo Live Order Synced]:', res);
    }).catch(err => {
      console.warn('[Odoo Order Sync Error]:', err);
    });

    renderConfirmationDetails();
    showToast(`🎉 Order #${randId} placed & synced with Odoo!`);

    // Smooth scroll to confirmation card or tab
    const confCard = document.getElementById('desktopConfirmationCard');
    if (confCard && state.activeViewMode === 'desktop') {
      confCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // add a brief highlight glow
      confCard.style.outline = '2px solid #22c55e';
      setTimeout(() => confCard.style.outline = 'none', 1800);
    }
  }

  // --- 6. VIEW SWITCHER & MODAL LOGIC ---
  function setViewMode(mode) {
    state.activeViewMode = mode;

    document.querySelectorAll('.switch-btn').forEach(btn => {
      const isCurrent = btn.getAttribute('data-mode') === mode;
      btn.classList.toggle('active', isCurrent);
      btn.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
    });

    const desk = document.getElementById('desktopView');
    const flow = document.getElementById('mobileShowcaseView');
    const sim = document.getElementById('mobileSingleView');

    if (desk) desk.style.display = mode === 'desktop' ? 'flex' : 'none';
    if (flow) flow.style.display = mode === 'mobile-flow' ? 'block' : 'none';
    if (sim) sim.style.display = mode === 'mobile-interactive' ? 'flex' : 'none';

    renderAll();
  }

  // Simulator tab switching
  window.simGoToCart = function () {
    document.getElementById('simTabProducts').classList.remove('active');
    document.getElementById('simTabConfirmation').classList.remove('active');
    document.getElementById('simTabCart').classList.add('active');
  };

  window.simGoToProducts = function () {
    document.getElementById('simTabCart').classList.remove('active');
    document.getElementById('simTabConfirmation').classList.remove('active');
    document.getElementById('simTabProducts').classList.add('active');
  };

  window.simPlaceOrder = function () {
    processCheckout();
    document.getElementById('simTabCart').classList.remove('active');
    document.getElementById('simTabProducts').classList.remove('active');
    document.getElementById('simTabConfirmation').classList.add('active');
  };

  // Global helpers
  window.clearCart = clearCart;
  window.processCheckout = processCheckout;

  window.switchToPhoneCart = function () {
    const screen2 = document.querySelector('.phone-screen-2');
    if (screen2) {
      screen2.scrollIntoView({ behavior: 'smooth', block: 'center' });
      screen2.style.transform = 'scale(1.02)';
      setTimeout(() => screen2.style.transform = 'none', 400);
    }
  };

  window.scrollToScreen = function (screenNum) {
    const screen = document.querySelector(`.phone-screen-${screenNum}`);
    if (screen) {
      screen.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Modals
  window.openShopModal = function () {
    const modal = document.getElementById('shopModal');
    if (modal) modal.classList.add('active');
  };

  window.closeModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  };

  window.openOrderModal = function () {
    const modal = document.getElementById('orderModal');
    const content = document.getElementById('receiptContent');
    const title = document.getElementById('receiptTitle');

    if (title) title.textContent = `Order Receipt #${state.currentOrder.orderId}`;

    if (content) {
      const totals = calculateCartTotals();
      const items = Object.entries(state.cart).filter(([_, qty]) => qty > 0);

      let itemsHtml = '';
      items.forEach(([prodId, qty]) => {
        const p = PRODUCTS.find(x => x.id === prodId);
        if (!p) return;
        itemsHtml += `
          <tr>
            <td>${p.name} &times; ${qty}</td>
            <td style="text-align:right;">${formatTZS(p.price * qty)}</td>
          </tr>
        `;
      });

      content.innerHTML = `
        <div style="font-size:0.88rem; line-height: 1.5;">
          <div style="display:flex; justify-content:space-between; border-bottom:1px solid #e2e8f0; padding-bottom:8px; margin-bottom:10px;">
            <div>
              <strong>NOVA MART DAR ES SALAAM</strong><br>
              <span style="color:#64748b;">Mikocheni Store &bull; Dar es Salaam</span>
            </div>
            <div style="text-align:right;">
              <strong>${state.currentOrder.orderId}</strong><br>
              <span style="color:#64748b;">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
          </div>

          <table class="receipt-table">
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align:right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml || '<tr><td colspan="2">No active items</td></tr>'}
            </tbody>
          </table>

          <div class="receipt-totals">
            <div style="display:flex; justify-content:space-between;">
              <span style="color:#64748b;">Subtotal:</span>
              <strong>${formatTZS(totals.subtotal)}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; color:#16a34a;">
              <span>Discount Applied:</span>
              <strong>- ${formatTZS(totals.discount)}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:1.05rem; border-top:1px solid #cbd5e1; padding-top:6px; margin-top:4px;">
              <span>Total Paid:</span>
              <strong style="color:#0047bb;">${formatTZS(totals.total)}</strong>
            </div>
          </div>

          <div style="margin-top:14px; padding:10px; background:#eff6ff; border-radius:8px; font-size:0.82rem; color:#1e40af;">
            📞 <strong>Communication Number:</strong> ${state.currentOrder.phone}<br>
            🚚 <strong>Status:</strong> Order Received &bull; Packaging in progress
          </div>

          <div class="receipt-barcode">
            ||| | |||| || | ||||| |||| | |||
          </div>
        </div>
      `;
    }

    if (modal) modal.classList.add('active');
  };

  // Toast System
  window.showToast = function (msg) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      <span>${msg}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2400);
  };

  // --- 7. EVENT LISTENERS ---
  function setupEventListeners() {
    // Mode switcher buttons
    document.querySelectorAll('.switch-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        setViewMode(mode);
      });
    });

    // Delegated Stepper Click Handler (for instant 0ms response across all views)
    document.addEventListener('click', (e) => {
      const plusBtn = e.target.closest('.btn-plus');
      if (plusBtn) {
        const prodId = plusBtn.getAttribute('data-id');
        if (prodId) updateQuantity(prodId, 1);
        return;
      }

      const minusBtn = e.target.closest('.btn-minus');
      if (minusBtn) {
        const prodId = minusBtn.getAttribute('data-id');
        if (prodId) updateQuantity(prodId, -1);
        return;
      }

      const delBtn = e.target.closest('.cart-delete-btn');
      if (delBtn) {
        const prodId = delBtn.getAttribute('data-id');
        if (prodId) removeFromCart(prodId);
        return;
      }
    });

    // Category pills (Desktop)
    const catContainer = document.getElementById('categoryPills');
    if (catContainer) {
      catContainer.addEventListener('click', (e) => {
        const pill = e.target.closest('.pill-btn');
        if (!pill) return;
        catContainer.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
        pill.classList.add('active');
        state.selectedCategory = pill.getAttribute('data-category') || 'All';
        renderDesktopProducts();
      });
    }

    // Category pills (Phone 1)
    const p1Cat = document.getElementById('phone1CategoryPills');
    if (p1Cat) {
      p1Cat.addEventListener('click', (e) => {
        const pill = e.target.closest('.m-pill');
        if (!pill) return;
        p1Cat.querySelectorAll('.m-pill').forEach(b => b.classList.remove('active'));
        pill.classList.add('active');
        state.selectedCategory = pill.getAttribute('data-category') || 'All';
        renderMobileFlowViews();
      });
    }

    // Category pills (Sim)
    const simCat = document.getElementById('simCategoryPills');
    if (simCat) {
      simCat.addEventListener('click', (e) => {
        const pill = e.target.closest('.m-pill');
        if (!pill) return;
        simCat.querySelectorAll('.m-pill').forEach(b => b.classList.remove('active'));
        pill.classList.add('active');
        state.selectedCategory = pill.getAttribute('data-category') || 'All';
        renderSimViews();
      });
    }

    // Instant Search (Desktop)
    const searchInput = document.getElementById('desktopSearchInput');
    const searchClear = document.getElementById('searchClearBtn');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.trim();
        if (searchClear) searchClear.style.display = state.searchQuery ? 'block' : 'none';
        renderDesktopProducts();
      });
    }
    if (searchClear) {
      searchClear.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        state.searchQuery = '';
        searchClear.style.display = 'none';
        renderDesktopProducts();
      });
    }

    // Phone 1 Search
    const p1Search = document.getElementById('phone1SearchInput');
    if (p1Search) {
      p1Search.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.trim();
        renderMobileFlowViews();
      });
    }

    // Sim Search
    const simSearch = document.getElementById('simSearchInput');
    if (simSearch) {
      simSearch.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.trim();
        renderSimViews();
      });
    }

    // Sort Dropdown
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        state.sortBy = e.target.value;
        renderDesktopProducts();
      });
    }

    // Place Order Buttons
    const btnDeskOrder = document.getElementById('btnDesktopPlaceOrder');
    if (btnDeskOrder) btnDeskOrder.addEventListener('click', processCheckout);

    // View Order Buttons
    const btnViewOrder = document.getElementById('btnViewOrderDetails');
    if (btnViewOrder) btnViewOrder.addEventListener('click', openOrderModal);

    // Continue Shopping Buttons
    const btnContinue = document.getElementById('btnContinueShoppingDesktop');
    if (btnContinue) {
      btnContinue.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    const btnConfirmContinue = document.getElementById('btnConfirmContinueShopping');
    if (btnConfirmContinue) {
      btnConfirmContinue.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    const btnBackToProd = document.getElementById('btnBackToProducts');
    if (btnBackToProd) {
      btnBackToProd.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Header buttons
    const btnVisit = document.getElementById('btnVisitShop');
    if (btnVisit) btnVisit.addEventListener('click', openShopModal);

    const btnCartHeader = document.getElementById('btnDesktopCart');
    if (btnCartHeader) {
      btnCartHeader.addEventListener('click', () => {
        const cartCard = document.getElementById('desktopCartCard');
        if (cartCard) cartCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }

    // Close modal on background click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
        }
      });
    });

    // Bell notifications
    const bellBtn = document.getElementById('btnPhone1Bell');
    if (bellBtn) {
      bellBtn.addEventListener('click', () => {
        showToast('🔔 Same-day Express delivery active in Dar es Salaam!');
      });
    }
    const simBell = document.getElementById('simBellBtn');
    if (simBell) {
      simBell.addEventListener('click', () => {
        showToast('🔔 Special Offer: TZS 1,500 off on orders over TZS 15,000');
      });
    }
  }

  // --- 8. INITIALIZE ---
  function init() {
    setupEventListeners();
    renderAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
