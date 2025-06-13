import { createClient, RedisClientType } from 'redis';
import { createLogger } from '../utils/logger';

const logger = createLogger('redis');

class RedisService {
  private client: RedisClientType;
  private isConnected: boolean = false;

  constructor() {
    let redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    // Ensure URL starts with redis:// or rediss://
    if (!redisUrl.startsWith('redis://') && !redisUrl.startsWith('rediss://')) {
      redisUrl = `redis://${redisUrl}`;
    }

    // For URLs with passwords containing special characters
    try {
      const url = new URL(redisUrl);
      if (url.password) {
        redisUrl = redisUrl.replace(
          `:${url.password}@`, 
          `:${encodeURIComponent(url.password)}@`
        );
      }
    } catch (e) {
      logger.warn('Error parsing Redis URL', { error: e });
    }
    this.client = createClient({
      url: redisUrl
    });

    this.client.on('error', (err) => {
      logger.error('Redis Client Error', err);
    });

    this.client.on('connect', () => {
      logger.info('Redis Client Connected');
      this.isConnected = true;
    });

    this.client.on('disconnect', () => {
      logger.warn('Redis Client Disconnected');
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
    }
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.setEx(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<number> {
    return await this.client.del(key);
  }

  async exists(key: string): Promise<number> {
    return await this.client.exists(key);
  }

  async setObject(key: string, obj: any, ttlSeconds?: number): Promise<void> {
    const value = JSON.stringify(obj);
    await this.set(key, value, ttlSeconds);
  }

  async getObject<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Error parsing JSON from Redis', { key, error });
      return null;
    }
  }

  async flushAll(): Promise<void> {
    await this.client.flushAll();
  }

  getClient(): RedisClientType {
    return this.client;
  }
}

export const redisService = new RedisService();