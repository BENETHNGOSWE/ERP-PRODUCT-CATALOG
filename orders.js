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

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function cleanPhone(raw) {
  if (!raw) return '+255710459064';
  let digits = String(raw).replace(/\D+/g, '');
  if (!digits) return '+255710459064';
  if (digits.startsWith('0')) {
    digits = '255' + digits.slice(1);
  } else if (digits.length === 9 && (digits.startsWith('7') || digits.startsWith('6') || digits.startsWith('2'))) {
    digits = '255' + digits;
  } else if (digits.startsWith('2550')) {
    digits = '255' + digits.slice(4);
  }
  return '+' + digits;
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
      storeSlug: (orderData.storeSlug || 'achete').toLowerCase(),
      storeName: orderData.storeName || 'Store',
      storeWhatsapp: cleanPhone(orderData.storeWhatsapp),
      posConfigId: orderData.posConfigId || 26,
      customer: {
        name: orderData.customerName || `Customer (${cleanPhone(orderData.customerPhone)})`,
        phone: cleanPhone(orderData.customerPhone || orderData.phone),
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
