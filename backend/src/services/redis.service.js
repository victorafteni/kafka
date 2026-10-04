const { createClient } = require('redis');
const config = require('../config/config');

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.connectionPromise = null;
  }

  async connect() {
    if (this.isConnected && this.client) {
      return this.client;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = (async () => {
      try {
        const clientOptions = config.redis.url
          ? { url: config.redis.url }
          : {
              socket: {
                host: config.redis.host,
                port: config.redis.port,
                reconnectStrategy: (retries) => {
                  if (retries > 10) {
                    console.error('[REDIS] Max reconnect retries reached.');
                    return new Error('Redis reconnect failed');
                  }
                  return Math.min(retries * 200, 3000);
                }
              },
              password: config.redis.password || undefined
            };

        this.client = createClient(clientOptions);

        this.client.on('error', (err) => {
          console.error('[REDIS] Client Error:', err.message);
          this.isConnected = false;
        });

        this.client.on('connect', () => {
          console.log(`[REDIS] Connecting to ${config.redis.host}:${config.redis.port}...`);
        });

        this.client.on('ready', () => {
          this.isConnected = true;
          console.log('[REDIS] Connection ready and established.');
        });

        this.client.on('end', () => {
          this.isConnected = false;
          console.log('[REDIS] Connection closed.');
        });

        await this.client.connect();
        this.isConnected = true;
        return this.client;
      } catch (err) {
        this.isConnected = false;
        this.connectionPromise = null;
        console.error('[REDIS] Initial connection failure:', err.message);
        throw err;
      }
    })();

    return this.connectionPromise;
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      this.connectionPromise = null;
      console.log('[REDIS] Disconnected cleanly.');
    }
  }

  async exists(key) {
    await this.connect();
    const result = await this.client.exists(key);
    return result === 1;
  }

  async get(key) {
    await this.connect();
    return await this.client.get(key);
  }

  async set(key, value) {
    await this.connect();
    return await this.client.set(key, value);
  }

  async getJson(key) {
    const raw = await this.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (err) {
      console.error(`[REDIS] Failed to parse JSON for key "${key}":`, err.message);
      return null;
    }
  }

  async setJson(key, value) {
    const serialized = JSON.stringify(value);
    return await this.set(key, serialized);
  }

  async delete(key) {
    await this.connect();
    return await this.client.del(key);
  }

  async lPush(key, value) {
    await this.connect();
    const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
    return await this.client.lPush(key, str);
  }

  async lRange(key, start = 0, stop = -1) {
    await this.connect();
    return await this.client.lRange(key, start, stop);
  }

  async lTrim(key, start, stop) {
    await this.connect();
    return await this.client.lTrim(key, start, stop);
  }

  async healthCheck() {
    try {
      if (!this.client || !this.isConnected) {
        await this.connect();
      }
      const ping = await this.client.ping();
      return { status: ping === 'PONG' ? 'ok' : 'degraded', redis: 'connected' };
    } catch (err) {
      return { status: 'degraded', redis: 'unavailable', error: err.message };
    }
  }
}

// Singleton instance
module.exports = new RedisService();
