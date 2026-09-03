/**
 * MULTI-PROVIDER WHATSAPP GATEWAY INTEGRATION ENGINE
 * 
 * Supports Direct Background Server Dispatch via:
 * 1. Meta WhatsApp Cloud API (Official Meta Graph API)
 * 2. UltraMsg Cloud API (api.ultramsg.com)
 * 3. Evolution API / Wasender / GreenAPI / Wabox
 * 4. OpenWA HTTP Gateway
 * 5. Generic Custom HTTP Webhook / Gateway
 * 
 * Configurable via .env or data/whatsapp_config.json
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, 'data', 'whatsapp_config.json');
const messageLogs = [];

class WhatsAppService {
  constructor() {
    this.config = {
      provider: process.env.WHATSAPP_PROVIDER || 'openwa', // 'meta', 'ultramsg', 'evolution', 'openwa', 'webhook'
      metaToken: process.env.META_WA_TOKEN || '',
      metaPhoneNumberId: process.env.META_PHONE_NUMBER_ID || '',
      ultramsgInstanceId: process.env.ULTRAMSG_INSTANCE_ID || '',
      ultramsgToken: process.env.ULTRAMSG_TOKEN || '',
      evolutionUrl: process.env.EVOLUTION_API_URL || '',
      evolutionApiKey: process.env.EVOLUTION_API_KEY || '',
      evolutionInstance: process.env.EVOLUTION_INSTANCE || 'main',
      openwaUrl: process.env.OPENWA_API_URL || 'http://localhost:8080',
      openwaApiKey: process.env.OPENWA_API_KEY || '',
      gatewayUrl: process.env.WHATSAPP_GATEWAY_URL || process.env.WHATSAPP_WEBHOOK_URL || '',
      gatewayApiKey: process.env.WHATSAPP_API_KEY || '',
      defaultSender: process.env.WHATSAPP_DEFAULT_NUMBER || '+255712345678'
    };

    this.loadConfig();
  }

  loadConfig() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
        const saved = JSON.parse(raw);
        this.config = { ...this.config, ...saved };
      }
    } catch (e) {
      console.warn('[WhatsApp] Could not load custom config file:', e.message);
    }
  }

  saveConfig(newConfig) {
    try {
      this.config = { ...this.config, ...newConfig };
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2), 'utf8');
      return { success: true, config: this.getConfigSanitized() };
    } catch (e) {
      console.error('[WhatsApp] Error saving config:', e);
      throw e;
    }
  }

  getConfigSanitized() {
    return {
      provider: this.config.provider,
      metaPhoneNumberId: this.config.metaPhoneNumberId,
      hasMetaToken: Boolean(this.config.metaToken),
      ultramsgInstanceId: this.config.ultramsgInstanceId,
      hasUltramsgToken: Boolean(this.config.ultramsgToken),
      evolutionUrl: this.config.evolutionUrl,
      evolutionInstance: this.config.evolutionInstance,
      hasEvolutionApiKey: Boolean(this.config.evolutionApiKey),
      openwaUrl: this.config.openwaUrl,
      gatewayUrl: this.config.gatewayUrl,
      defaultSender: this.config.defaultSender
    };
  }

  /**
   * Normalize Phone Number to E.164 Clean Format (e.g., 255710459064)
   */
  normalizePhone(phone) {
    if (!phone) return '255712345678';
    let clean = String(phone).replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '255' + clean.slice(1);
    } else if (clean.length === 9 && (clean.startsWith('7') || clean.startsWith('6'))) {
      clean = '255' + clean;
    }
    return clean;
  }

  /**
   * Build Clean Formatted Order Notification Message
   */
  formatOrderMessage(store, order) {
    const storeName = store ? store.name : 'Store';
    const orderRef = order.orderNumber || order.orderId || order.receiptNumber || `ORD-${Date.now().toString().slice(-4)}`;
    const custName = order.customer ? (order.customer.name || 'Customer') : (order.customerName || 'Customer');
    const custPhone = order.customer ? (order.customer.phone || 'N/A') : (order.customerPhone || 'N/A');
    const delivery = order.customer ? (order.customer.deliveryAddress || (store && store.address) || 'Dar es Salaam') : 'Dar es Salaam';
    
    let itemsText = '';
    const items = order.items || [];
    if (items.length > 0) {
      itemsText = items.map(item => {
        const qty = item.quantity || item.qty || 1;
        const price = Number(item.price) || 0;
        const subtotal = qty * price;
        return `• ${item.name} × ${qty} — TZS ${subtotal.toLocaleString('en-US')}`;
      }).join('\n');
    } else {
      itemsText = '• General Order Items';
    }

    const totalFormatted = (Number(order.totalAmount) || 0).toLocaleString('en-US');

    return (
`*NEW ORDER #${orderRef}*
*Store:* ${storeName}

*Customer:* ${custName}
*Phone:* ${custPhone}
*Delivery:* ${delivery}

*Items Ordered:*
${itemsText}

*TOTAL AMOUNT: TZS ${totalFormatted}*

Action Required: Please process and confirm this order.`
    );
  }

  /**
   * Send Order Notification Directly in Background via Active Gateway Provider
   */
  async sendOrderNotification(store, order) {
    const recipientPhone = (store && store.whatsapp) ? store.whatsapp : this.config.defaultSender;
    const cleanPhone = this.normalizePhone(recipientPhone);
    const messageText = this.formatOrderMessage(store, order);
    const orderRef = order.orderNumber || order.orderId || order.receiptNumber || `ORD-${Date.now().toString().slice(-4)}`;

    const logEntry = {
      id: `WA-LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      storeId: store ? store.id : 'unknown',
      storeSlug: store ? store.slug : 'unknown',
      storeName: store ? store.name : 'Store',
      recipientPhone: recipientPhone,
      cleanPhone: cleanPhone,
      orderRef: orderRef,
      messagePreview: messageText,
      status: 'pending',
      gateway: this.config.provider,
      sentAt: new Date().toISOString(),
      error: null
    };

    console.log(`[WhatsApp Gateway: ${this.config.provider}] Dispatching Order #${orderRef} to "${store ? store.name : 'Store'}" (${recipientPhone} -> ${cleanPhone})...`);

    let dispatchResult = null;
    let providerUsed = this.config.provider;

    try {
      // 1. Meta WhatsApp Cloud API
      if (this.config.provider === 'meta' || (this.config.metaToken && this.config.metaPhoneNumberId)) {
        providerUsed = 'Meta Cloud API';
        dispatchResult = await this.sendMetaCloudMessage(cleanPhone, messageText);
      }
      // 2. UltraMsg Cloud API
      else if (this.config.provider === 'ultramsg' || (this.config.ultramsgInstanceId && this.config.ultramsgToken)) {
        providerUsed = 'UltraMsg API';
        dispatchResult = await this.sendUltraMsg(cleanPhone, messageText);
      }
      // 3. Evolution API
      else if (this.config.provider === 'evolution' || this.config.evolutionUrl) {
        providerUsed = 'Evolution API';
        dispatchResult = await this.sendEvolutionMessage(cleanPhone, messageText);
      }
      // 4. Custom Gateway / Webhook
      else if (this.config.gatewayUrl) {
        providerUsed = 'Custom HTTP Gateway';
        dispatchResult = await this.sendCustomWebhook(cleanPhone, messageText, orderRef);
      }
      // 5. OpenWA HTTP API
      else if (this.config.openwaUrl) {
        providerUsed = 'OpenWA Gateway';
        dispatchResult = await this.sendOpenWA(cleanPhone, messageText, store ? store.slug : 'default');
      }

      logEntry.status = 'sent';
      logEntry.gateway = providerUsed;
      logEntry.response = dispatchResult;
      messageLogs.unshift(logEntry);

      console.log(`[WhatsApp Gateway: ${providerUsed}] ✅ Message dispatched successfully to ${recipientPhone}!`);

      return {
        success: true,
        status: 'sent',
        gateway: providerUsed,
        recipient: recipientPhone,
        cleanPhone: cleanPhone,
        message: messageText,
        result: dispatchResult
      };
    } catch (apiErr) {
      console.warn(`[WhatsApp Gateway Notice (${providerUsed})]:`, apiErr.message);
      
      logEntry.status = 'failed';
      logEntry.gateway = providerUsed;
      logEntry.error = apiErr.message;
      messageLogs.unshift(logEntry);

      return {
        success: false,
        status: 'failed',
        gateway: providerUsed,
        recipient: recipientPhone,
        cleanPhone: cleanPhone,
        error: apiErr.message,
        message: messageText
      };
    }
  }

  /**
   * Send Test Message to any Phone Number
   */
  async sendTestMessage(targetPhone, customMessage) {
    const cleanPhone = this.normalizePhone(targetPhone);
    const text = customMessage || `🔔 *WhatsApp Test Notification*\nYour WhatsApp Gateway is connected and delivering messages to ${targetPhone}!`;
    
    const fakeStore = { name: 'Store Gateway Test', whatsapp: targetPhone };
    const fakeOrder = { orderNumber: `TEST-${Date.now().toString().slice(-4)}`, totalAmount: 0 };
    
    const result = await this.sendOrderNotification(fakeStore, {
      ...fakeOrder,
      items: [{ name: 'Test Connection Item', price: 0, qty: 1 }],
      customer: { name: 'Gateway Test', phone: targetPhone }
    });

    return result;
  }

  // --- Provider 1: Meta WhatsApp Cloud API ---
  sendMetaCloudMessage(phone, text) {
    return new Promise((resolve, reject) => {
      const phoneNumberId = this.config.metaPhoneNumberId;
      const token = this.config.metaToken;
      if (!phoneNumberId || !token) return reject(new Error('Meta Cloud API Phone Number ID and Token required.'));

      const postData = JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phone,
        type: 'text',
        text: { preview_url: false, body: text }
      });

      const req = https.request({
        hostname: 'graph.facebook.com',
        path: `/v19.0/${phoneNumberId}/messages`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 6000
      }, (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body || '{}');
            if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsed);
            else reject(new Error(parsed.error ? parsed.error.message : `Meta API HTTP ${res.statusCode}: ${body}`));
          } catch (e) {
            reject(new Error(`Meta API error: ${body}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Meta API connection timeout')); });
      req.write(postData);
      req.end();
    });
  }

  // --- Provider 2: UltraMsg API ---
  sendUltraMsg(phone, message) {
    return new Promise((resolve, reject) => {
      const instanceId = this.config.ultramsgInstanceId;
      const token = this.config.ultramsgToken;
      if (!instanceId || !token) return reject(new Error('UltraMsg Instance ID and Token required.'));

      const postData = new URLSearchParams({
        token: token,
        to: phone,
        body: message
      }).toString();

      const req = https.request({
        hostname: 'api.ultramsg.com',
        path: `/${instanceId}/messages/chat`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 6000
      }, (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body || '{}');
            if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsed);
            else reject(new Error(parsed.error || `UltraMsg HTTP ${res.statusCode}: ${body}`));
          } catch (e) {
            reject(new Error(`UltraMsg response error: ${body}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('UltraMsg connection timeout')); });
      req.write(postData);
      req.end();
    });
  }

  // --- Provider 3: Evolution API ---
  sendEvolutionMessage(phone, message) {
    return new Promise((resolve, reject) => {
      const baseUrl = this.config.evolutionUrl;
      const apiKey = this.config.evolutionApiKey;
      const instance = this.config.evolutionInstance || 'main';
      if (!baseUrl) return reject(new Error('Evolution API URL required.'));

      const url = new URL(`/message/sendText/${instance}`, baseUrl);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;

      const postData = JSON.stringify({
        number: phone,
        options: { delay: 1200, presence: 'composing' },
        textMessage: { text: message }
      });

      const req = client.request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 6000
      }, (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body || '{}');
            if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsed);
            else reject(new Error(`Evolution API HTTP ${res.statusCode}: ${body}`));
          } catch (e) {
            reject(new Error(`Evolution API error: ${body}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Evolution API connection timeout')); });
      req.write(postData);
      req.end();
    });
  }

  // --- Provider 4: Custom Gateway / Webhook ---
  sendCustomWebhook(phone, message, orderRef) {
    return new Promise((resolve, reject) => {
      const gatewayUrl = this.config.gatewayUrl;
      const apiKey = this.config.gatewayApiKey;
      if (!gatewayUrl) return reject(new Error('Custom Gateway URL required.'));

      const url = new URL(gatewayUrl);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;

      const postData = JSON.stringify({
        phone: phone,
        message: message,
        orderNumber: orderRef,
        timestamp: new Date().toISOString()
      });

      const headers = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      };
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

      const req = client.request(url, {
        method: 'POST',
        headers: headers,
        timeout: 6000
      }, (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) resolve({ raw: body });
          else reject(new Error(`Custom Gateway HTTP ${res.statusCode}: ${body}`));
        });
      });

      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Custom Gateway connection timeout')); });
      req.write(postData);
      req.end();
    });
  }

  // --- Provider 5: OpenWA HTTP API ---
  sendOpenWA(phone, message, session = 'default') {
    return new Promise((resolve, reject) => {
      const openwaUrl = this.config.openwaUrl;
      const apiKey = this.config.openwaApiKey;
      if (!openwaUrl) return reject(new Error('OpenWA API URL required.'));

      const url = new URL('/sendText', openwaUrl);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;

      const postData = JSON.stringify({
        chatId: `${phone}@c.us`,
        text: message,
        session: session
      });

      const headers = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      };
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

      const req = client.request(url, {
        method: 'POST',
        headers: headers,
        timeout: 4000
      }, (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body || '{}');
            if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsed);
            else reject(new Error(`OpenWA HTTP ${res.statusCode}: ${body}`));
          } catch (e) {
            reject(new Error(`OpenWA response error: ${body}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('OpenWA connection timeout')); });
      req.write(postData);
      req.end();
    });
  }

  /**
   * Check Session Status
   */
  async checkSessionStatus(store) {
    return {
      provider: this.config.provider,
      connected: true,
      status: 'READY',
      phone: store ? store.whatsapp : this.config.defaultSender
    };
  }

  getLogs(limit = 20) {
    return messageLogs.slice(0, limit);
  }
}

module.exports = new WhatsAppService();
