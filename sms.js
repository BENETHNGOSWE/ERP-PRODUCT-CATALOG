/**
 * KILAKONA SMS MESSAGING GATEWAY MODULE
 * Sends automated SMS order receipts and merchant alerts with Sender ID "KODATECH"
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SMS_CONFIG_FILE = path.join(__dirname, 'data', 'sms_config.json');

const smsLogs = [];
function addSmsLog(logEntry) {
  smsLogs.unshift(logEntry);
  if (smsLogs.length > 500) smsLogs.length = 500;
}

class SmsService {
  constructor() {
    this.config = {
      enabled: true,
      apiKey: process.env.KILAKONA_API_KEY || 'developerbeneth',
      apiSecret: process.env.KILAKONA_API_SECRET || 'CCSognh9JtfTL7v8NcXi',
      senderId: process.env.KILAKONA_SENDER_ID || 'KODATECH',
      deliveryReportUrl: 'https://achete.me/api/webhook/sms'
    };
    this.loadConfig();
  }

  loadConfig() {
    try {
      if (fs.existsSync(SMS_CONFIG_FILE)) {
        const raw = fs.readFileSync(SMS_CONFIG_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        this.config = { ...this.config, ...parsed };
      } else {
        this.saveConfig();
      }
    } catch (e) {
      console.error('[SMS] Error loading config:', e.message);
    }
  }

  saveConfig() {
    try {
      const dataDir = path.dirname(SMS_CONFIG_FILE);
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(SMS_CONFIG_FILE, JSON.stringify(this.config, null, 2), 'utf8');
    } catch (e) {
      console.error('[SMS] Error saving config:', e.message);
    }
  }

  /**
   * Normalize Phone Number to Kilakona format (e.g., 255710459064)
   */
  normalizePhone(phone) {
    if (!phone) return '255710459064';
    let clean = String(phone).replace(/\D+/g, '');
    if (!clean) return '255710459064';
    if (clean.startsWith('0')) {
      clean = '255' + clean.slice(1);
    } else if (clean.length === 9 && (clean.startsWith('7') || clean.startsWith('6') || clean.startsWith('2'))) {
      clean = '255' + clean;
    } else if (clean.startsWith('2550')) {
      clean = '255' + clean.slice(4);
    }
    return clean;
  }

  /**
   * Send Direct SMS via Kilakona API
   */
  async sendSms(targetPhone, messageText) {
    const cleanPhone = this.normalizePhone(targetPhone);
    const logEntry = {
      id: `SMS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      recipient: cleanPhone,
      message: messageText,
      senderId: this.config.senderId,
      status: 'pending',
      response: null,
      error: null
    };

    if (!this.config.enabled || !this.config.apiKey || !this.config.apiSecret) {
      logEntry.status = 'skipped_disabled';
      addSmsLog(logEntry);
      return { success: false, reason: 'SMS gateway is disabled or unconfigured' };
    }

    return new Promise((resolve) => {
      const postData = JSON.stringify({
        senderId: this.config.senderId,
        messageType: 'text',
        message: messageText,
        contacts: cleanPhone,
        deliveryReportUrl: this.config.deliveryReportUrl
      });

      const req = https.request({
        hostname: 'messaging.kilakona.co.tz',
        path: '/api/v1/vendor/message/send',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api_key': this.config.apiKey,
          'api_secret': this.config.apiSecret,
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 10000
      }, (res) => {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (res.statusCode === 200 && data.success) {
              logEntry.status = 'sent';
              logEntry.response = data;
              addSmsLog(logEntry);
              console.log(`[Kilakona SMS: ${this.config.senderId}] ✅ SMS sent to ${cleanPhone}: "${messageText.slice(0, 45)}..." (Shoot ID: ${data.data?.shootId || 'OK'})`);
              resolve({ success: true, shootId: data.data?.shootId, data: data });
            } else {
              logEntry.status = 'failed';
              logEntry.error = data.message || `HTTP ${res.statusCode}`;
              addSmsLog(logEntry);
              console.warn(`[Kilakona SMS] ⚠️ SMS dispatch notice (${res.statusCode}):`, data.message || body);
              resolve({ success: false, error: data.message || body });
            }
          } catch (e) {
            logEntry.status = 'failed';
            logEntry.error = body || e.message;
            addSmsLog(logEntry);
            resolve({ success: false, error: body || e.message });
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        logEntry.status = 'timeout';
        logEntry.error = 'Request timed out';
        addSmsLog(logEntry);
        console.warn(`[Kilakona SMS] Request timed out to ${cleanPhone}`);
        resolve({ success: false, error: 'Request timeout' });
      });

      req.on('error', (err) => {
        logEntry.status = 'failed';
        logEntry.error = err.message;
        addSmsLog(logEntry);
        console.error(`[Kilakona SMS] ❌ Error sending SMS to ${cleanPhone}:`, err.message);
        resolve({ success: false, error: err.message });
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Send Customer Order Confirmation SMS
   */
  async sendCustomerReceipt(targetPhone, store, order) {
    const storeName = store ? store.name : 'Store';
    const orderRef = order.orderNumber || order.orderId || order.receiptNumber || `ORD-${Date.now().toString().slice(-4)}`;
    const totalFormatted = (Number(order.totalAmount || order.total || 0)).toLocaleString('en-US');
    const itemsList = (order.items || []).map(i => `${i.name || 'Item'} (${i.qty || i.quantity || 1}x)`).join(', ') || 'Items';

    const message = `ACHETE RECEIPT: Thank you for ordering with ${storeName}! Order #${orderRef}. Items: ${itemsList}. Total: TZS ${totalFormatted}. Your order is being processed. https://achete.me`;

    return this.sendSms(targetPhone, message);
  }

  /**
   * Send Merchant New Order Alert SMS
   */
  async sendOrderNotification(store, order) {
    const recipientPhone = (store && store.whatsapp) ? store.whatsapp : '255757681480';
    const storeName = store ? store.name : 'Store';
    const storeSlug = (store && store.slug) ? store.slug : 'benstore';
    const orderRef = order.orderNumber || order.orderId || order.receiptNumber || `ORD-${Date.now().toString().slice(-4)}`;
    
    const rawCustPhone = (order.customer && order.customer.phone) || order.customerPhone || '';
    const custPhone = rawCustPhone ? `+${this.normalizePhone(rawCustPhone)}` : 'N/A';

    const totalFormatted = (Number(order.totalAmount || order.total || 0)).toLocaleString('en-US');
    const itemsList = (order.items || []).map(i => `${i.name || 'Item'} (${i.qty || i.quantity || 1}x)`).join(', ') || 'Items';

    const message = `NEW ORDER #${orderRef} for ${storeName}! Customer: (${custPhone}). Items: ${itemsList}. Total: TZS ${totalFormatted}. Fulfill at achete.me/${storeSlug}`;

    return this.sendSms(recipientPhone, message);
  }

  getLogs(limit = 50) {
    return smsLogs.slice(0, limit);
  }
}

module.exports = new SmsService();
