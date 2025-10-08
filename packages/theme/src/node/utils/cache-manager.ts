import fs from "fs";
import path from "path";
import { createHash } from "crypto";

export interface CacheOptions {
  /**
   * Cache storage strategy
   * - "single-file": All data in one JSON file (better for small datasets, frequent updates)
   * - "multi-file": One file per key using MD5 hash (better for large datasets)
   */
  strategy: "single-file" | "multi-file";

  /**
   * Cache file path or directory path
   * For single-file: path to the JSON file
   * For multi-file: path to the cache directory
   */
  cachePath: string;

  /**
   * Time-to-live in milliseconds (default: 7 days)
   */
  ttl?: number;

  /**
   * Log prefix for error messages
   */
  logPrefix?: string;
}

interface CachedData<T> {
  data: T;
  timestamp: number;
}

/**
 * Generic cache manager supporting both single-file and multi-file strategies
 */
export class CacheManager<T> {
  private strategy: "single-file" | "multi-file";
  private cachePath: string;
  private ttl: number;
  private logPrefix: string;

  // For single-file strategy: in-memory cache
  private memoryCache: Map<string, CachedData<T>> | null = null;

  constructor(options: CacheOptions) {
    this.strategy = options.strategy;
    this.cachePath = options.cachePath;
    this.ttl = options.ttl ?? 7 * 24 * 60 * 60 * 1000; // Default: 7 days
    this.logPrefix = options.logPrefix ?? "Cache";
  }

  /**
   * Get cached data by key
   */
  get(key: string): T | null {
    if (this.strategy === "single-file") {
      return this.getSingleFile(key);
    } else {
      return this.getMultiFile(key);
    }
  }

  /**
   * Set cached data for key
   */
  set(key: string, data: T): void {
    if (this.strategy === "single-file") {
      this.setSingleFile(key, data);
    } else {
      this.setMultiFile(key, data);
    }
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    try {
      if (this.strategy === "single-file") {
        if (fs.existsSync(this.cachePath)) {
          fs.unlinkSync(this.cachePath);
        }
        this.memoryCache = null;
      } else {
        if (fs.existsSync(this.cachePath)) {
          const files = fs.readdirSync(this.cachePath);
          files.forEach((file) => {
            fs.unlinkSync(path.join(this.cachePath, file));
          });
        }
      }
    } catch (error) {
      console.warn(`[${this.logPrefix}] Error clearing cache:`, error);
    }
  }

  // ============= Single-file strategy =============

  private loadSingleFileCache(): Map<string, CachedData<T>> {
    if (this.memoryCache !== null) {
      return this.memoryCache;
    }

    try {
      if (fs.existsSync(this.cachePath)) {
        const data = JSON.parse(fs.readFileSync(this.cachePath, "utf-8"));
        this.memoryCache = new Map(Object.entries(data));
        return this.memoryCache;
      }
    } catch (error) {
      console.warn(`[${this.logPrefix}] Error loading cache file:`, error);
    }

    this.memoryCache = new Map();
    return this.memoryCache;
  }

  private saveSingleFileCache(): void {
    try {
      this.ensureDirectory(path.dirname(this.cachePath));
      const cacheObject = Object.fromEntries(this.memoryCache!);
      fs.writeFileSync(this.cachePath, JSON.stringify(cacheObject, null, 2));
    } catch (error) {
      console.warn(`[${this.logPrefix}] Error saving cache file:`, error);
    }
  }

  private getSingleFile(key: string): T | null {
    try {
      const cache = this.loadSingleFileCache();
      const cached = cache.get(key);

      if (!cached) {
        return null;
      }

      // Check if expired
      if (Date.now() - cached.timestamp > this.ttl) {
        cache.delete(key);
        this.saveSingleFileCache();
        return null;
      }

      return cached.data;
    } catch (error) {
      console.warn(
        `[${this.logPrefix}] Error reading cache for ${key}:`,
        error,
      );
      return null;
    }
  }

  private setSingleFile(key: string, data: T): void {
    try {
      const cache = this.loadSingleFileCache();
      cache.set(key, {
        data,
        timestamp: Date.now(),
      });
      this.saveSingleFileCache();
    } catch (error) {
      console.warn(
        `[${this.logPrefix}] Error writing cache for ${key}:`,
        error,
      );
    }
  }

  // ============= Multi-file strategy =============

  private getCacheKey(key: string): string {
    return createHash("md5").update(key).digest("hex");
  }

  private getMultiFile(key: string): T | null {
    try {
      const cacheKey = this.getCacheKey(key);
      const filePath = path.join(this.cachePath, `${cacheKey}.json`);

      if (!fs.existsSync(filePath)) {
        return null;
      }

      const cached: CachedData<T> = JSON.parse(
        fs.readFileSync(filePath, "utf-8"),
      );

      // Check if expired
      if (Date.now() - cached.timestamp > this.ttl) {
        fs.unlinkSync(filePath);
        return null;
      }

      return cached.data;
    } catch (error) {
      console.warn(
        `[${this.logPrefix}] Error reading cache for ${key}:`,
        error,
      );
      return null;
    }
  }

  private setMultiFile(key: string, data: T): void {
    try {
      this.ensureDirectory(this.cachePath);
      const cacheKey = this.getCacheKey(key);
      const filePath = path.join(this.cachePath, `${cacheKey}.json`);

      const cached: CachedData<T> = {
        data,
        timestamp: Date.now(),
      };

      fs.writeFileSync(filePath, JSON.stringify(cached, null, 2));
    } catch (error) {
      console.warn(
        `[${this.logPrefix}] Error writing cache for ${key}:`,
        error,
      );
    }
  }

  // ============= Utilities =============

  private ensureDirectory(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}
