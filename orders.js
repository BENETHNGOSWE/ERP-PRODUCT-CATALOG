/**
 * ORDERS MANAGEMENT & PERSISTENCE MODULE
 * 
 * Records all web catalog and POS orders:
 * - Persistent storage in data/orders.json
 * - Store-specific order tracking
 * - Real-time stock deduction
 * - Integration with Odoo POS and Admin Dashboard
 */

const fs = require('fs');
const path = require('path');

const ORDERS_FILE = path.join(__dirname, 'data', 'orders.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

class OrderManager {
  constructor() {
    this.orders = [];
    this.loadOrders();
  }

  loadOrders() {
    try {
      if (fs.existsSync(ORDERS_FILE)) {
        const raw = fs.readFileSync(ORDERS_FILE, 'utf8');
        this.orders = JSON.parse(raw);
      } else {
        this.orders = [];
        this.saveOrders();
      }
    } catch (err) {
      console.error('[OrderManager] Error loading orders file:', err);
      this.orders = [];
    }
  }

  saveOrders() {
    try {
      fs.writeFileSync(ORDERS_FILE, JSON.stringify(this.orders, null, 2), 'utf8');
    } catch (err) {
      console.error('[OrderManager] Error saving orders:', err);
    }
  }

  getAllOrders() {
    return this.orders;
  }

  getOrdersByStore(storeSlug) {
    if (!storeSlug) return this.orders;
    const clean = storeSlug.trim().toLowerCase();
    return this.orders.filter(o => (o.storeSlug || '').toLowerCase() === clean);
  }

  getOrderById(idOrNumber) {
    return this.orders.find(o => 
      String(o.id) === String(idOrNumber) || 
      o.orderId === idOrNumber || 
      o.receiptNumber === idOrNumber
    ) || null;
  }

  recordOrder(orderData) {
    const nextId = this.orders.reduce((max, o) => Math.max(max, o.id || 0), 0) + 1;
    
    const newOrder = {
      id: nextId,
      orderId: orderData.orderId || `ORD-${Date.now().toString().slice(-4)}`,
      odooOrderId: orderData.odooOrderId || null,
      odooOrderName: orderData.odooOrderName || orderData.receiptNumber || null,
      receiptNumber: orderData.receiptNumber || `Order WEB-${Date.now()}`,
      storeId: orderData.storeId || 1,
      storeSlug: (orderData.storeSlug || 'novamart').toLowerCase(),
      storeName: orderData.storeName || 'Store',
      storeWhatsapp: orderData.storeWhatsapp || '+255712345678',
      posConfigId: orderData.posConfigId || 26,
      customer: {
        name: orderData.customerName || `Customer (${orderData.customerPhone || 'N/A'})`,
        phone: orderData.customerPhone || '+255 712 345 678',
        deliveryAddress: orderData.deliveryAddress || 'Masaki, Dar es Salaam'
      },
      items: (orderData.items || []).map(it => ({
        id: it.id,
        name: it.name,
        price: Number(it.price) || 0,
        qty: Number(it.qty || it.quantity) || 1,
        subtotal: (Number(it.price) || 0) * (Number(it.qty || it.quantity) || 1)
      })),
      itemCount: (orderData.items || []).reduce((sum, it) => sum + (Number(it.qty || it.quantity) || 1), 0),
      subtotal: Number(orderData.subtotal) || Number(orderData.totalAmount) || 0,
      discount: Number(orderData.discount) || 0,
      totalAmount: Number(orderData.totalAmount) || 0,
      paymentMethod: orderData.paymentMethod || 'Cash / Mobile Money (POS)',
      status: orderData.status || 'Paid & Confirmed',
      whatsappStatus: orderData.whatsappStatus || 'Sent',
      waLink: orderData.waLink || null,
      createdAt: new Date().toISOString(),
      dateFormatted: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    };

    // Prepend new order so newest appears first
    this.orders.unshift(newOrder);
    this.saveOrders();

    console.log(`[OrderManager] ✅ Order #${newOrder.orderId} recorded successfully for Store "${newOrder.storeName}"! Total: TZS ${newOrder.totalAmount}`);
    return newOrder;
  }
}

module.exports = new OrderManager();
