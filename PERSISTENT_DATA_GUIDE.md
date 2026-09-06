# 🛡️ Persistent Data & Deployment Guide for ACHETE.ME

This guide explains **why data is erased during redeployment** and **how to configure Coolify / Docker so all store data, inventory, and orders are 100% permanently preserved** across all Git pushes and redeployments.

---

## ❓ Why Was Data Disappearing on Redeploy?

When you deploy with **Coolify / Docker**:
1. Every time you push to Git and click **Redeploy**, Coolify builds a **brand new Docker container**.
2. By default, Docker containers have an **ephemeral (temporary) filesystem**.
3. When the new container starts, the old container is deleted, and anything saved inside the container during runtime (`data/stores.json`, `data/orders.json`) gets wiped out unless a **Persistent Storage Mount (Volume)** is configured.

---

## 🚀 The Permanent Solution (Takes 10 Seconds in Coolify)

To ensure your data survives **infinite Git pushes and redeployments**, you simply tell Coolify to store the `/app/data` directory on the host server disk.

### Step-by-Step Configuration in Coolify:

1. **Open Coolify Dashboard** (`https://your-coolify-instance.com`).
2. Go to your **ACHETE.ME Application**.
3. In the left navigation menu, click **Storages** (or **Persistent Storage** / **Volumes**).
4. Click **+ Add Storage** / **New Volume**:
   - **Destination Path (in Container):** `/app/data`
   - **Source / Name:** `achete_data` (or leave as generated volume name)
5. Click **Save**.
6. Click **Redeploy**.

---

## ✅ How It Works Under the Hood

```
   ┌─────────────────────────────────────────────────────────┐
   │                    YOUR HOST SERVER                     │
   │                                                         │
   │   📁 Persistent Storage: /var/lib/docker/volumes/achete │
   │      ├── 📄 stores.json  (Client stores, stock & PINs)  │
   │      └── 📄 orders.json  (Customer orders & history)    │
   └──────────────────────────┬──────────────────────────────┘
                              │ Mounted to /app/data
                              ▼
   ┌─────────────────────────────────────────────────────────┐
   │             DOCKER CONTAINER (ACHETE.ME)                │
   │                                                         │
   │   🚀 New Code & Features from Git Push                  │
   │   🔗 Reads & Writes directly to /app/data (Mounted)     │
   └─────────────────────────────────────────────────────────┘
```

- **When you push new code:** Coolify rebuilds the app container.
- **When the container boots:** Docker reattaches the existing `achete_data` volume to `/app/data`.
- **Result:**
  - ✅ All client stores remain intact.
  - ✅ All inventory stock counts remain intact.
  - ✅ All custom products and photos remain intact.
  - ✅ All customer orders remain intact.
  - ✅ Zero data loss on redeployment!

---

## 🛠️ Code Safeguards Added in the Backend

1. **`DATA_DIR` Environment Variable Support:**
   - The app now checks `process.env.DATA_DIR || path.join(__dirname, 'data')`.
   - In Docker/Coolify, `ENV DATA_DIR=/app/data` is automatically configured.

2. **Non-Destructive Seeding:**
   - The server only creates initial default store templates if `/app/data/stores.json` does **not** exist.
   - If user data already exists in `/app/data/stores.json`, the server **never** overwrites it.

3. **`VOLUME ["/app/data"]` in Dockerfile:**
   - Declares the storage mount point in the container image.
