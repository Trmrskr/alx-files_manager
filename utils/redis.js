import redis from 'redis';
import { promisify } from 'util';
/**
 * RedisClient class
 */

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.connected = true;

    this.client.on('error', (error) => {
      console.log(`Redis client not connected to the server: ${error.message}`);
      this.connected = false;
    });

    this.client.on('connect', () => {
      this.connected = true;
    });
  }

  /**
   * Check if connection to Redis is Alive
   */
  isAlive() {
    return this.connected;
  }

  /**
   * get value with a key
   */
  async get(key) {
    const getValue = promisify(this.client.get).bind(this.client);
    return getValue(key);
  }

  /**
   * set value with a key
   */
  async set(key, value, duration) {
    const setValue = promisify(this.client.setex).bind(this.client);
    setValue(key, duration, value);
  }

  /**
   * Delete value with a key
   */
  async del(key) {
    const delValue = promisify(this.client.del).bind(this.client);
    delValue(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;
