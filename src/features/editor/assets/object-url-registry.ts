/**
 * Object URL Registry Module
 * 
 * Manages lifecycle of object URLs (blob URLs) for image assets:
 * - Creates object URLs from Files/Blobs
 * - Tracks URLs for cleanup
 * - Revokes URLs when assets are replaced or released
 * - Prevents memory leaks
 */

export interface ObjectUrlEntry {
  url: string;
  createdAt: number;
  source: 'file' | 'blob' | 'processed';
  metadata?: Record<string, unknown>;
}

export interface RegistryStats {
  totalUrls: number;
  activeUrls: number;
  revokedUrls: number;
}

export type ObjectUrlRegistryListener = (event: { type: 'created' | 'revoked'; url: string; entry?: ObjectUrlEntry }) => void;

/**
 * Object URL Registry class for managing URL lifecycle
 */
export class ObjectUrlRegistry {
  private urls: Map<string, ObjectUrlEntry> = new Map();
  private revoked: Set<string> = new Set();
  private listeners: Set<ObjectUrlRegistryListener> = new Set();
  private maxUrls: number;

  constructor(options?: { maxUrls?: number }) {
    this.maxUrls = options?.maxUrls ?? 100;
  }

  /**
   * Subscribe to registry events
   */
  subscribe(listener: ObjectUrlRegistryListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of an event
   */
  private emit(event: { type: 'created' | 'revoked'; url: string; entry?: ObjectUrlEntry }): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        // Silently handle listener errors
        console.error('ObjectUrlRegistry listener error:', error);
      }
    });
  }

  /**
   * Create an object URL from a File or Blob
   */
  create(source: File | Blob, options?: { source?: ObjectUrlEntry['source']; metadata?: Record<string, unknown> }): string {
    // Check if we've hit the limit
    if (this.urls.size >= this.maxUrls) {
      // Revoke oldest URL to make room
      this.revokeOldest();
    }

    const url = URL.createObjectURL(source);
    const entry: ObjectUrlEntry = {
      url,
      createdAt: Date.now(),
      source: options?.source ?? 'blob',
      metadata: options?.metadata,
    };

    this.urls.set(url, entry);
    this.emit({ type: 'created', url, entry });

    return url;
  }

  /**
   * Create an object URL from a File specifically
   */
  createFromFile(file: File, metadata?: Record<string, unknown>): string {
    return this.create(file, {
      source: 'file',
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        ...metadata,
      },
    });
  }

  /**
   * Check if a URL is managed by this registry
   */
  has(url: string): boolean {
    return this.urls.has(url);
  }

  /**
   * Get entry metadata for a URL
   */
  get(url: string): ObjectUrlEntry | undefined {
    return this.urls.get(url);
  }

  /**
   * Revoke a specific URL
   */
  revoke(url: string): boolean {
    if (!this.urls.has(url)) {
      return false;
    }

    const entry = this.urls.get(url);
    
    URL.revokeObjectURL(url);
    this.urls.delete(url);
    this.revoked.add(url);

    this.emit({ type: 'revoked', url, entry });
    return true;
  }

  /**
   * Revoke all URLs matching a filter
   */
  revokeWhere(predicate: (entry: ObjectUrlEntry) => boolean): number {
    const urlsToRevoke: string[] = [];

    this.urls.forEach((entry, url) => {
      if (predicate(entry)) {
        urlsToRevoke.push(url);
      }
    });

    urlsToRevoke.forEach(url => this.revoke(url));
    return urlsToRevoke.length;
  }

  /**
   * Revoke all URLs from a specific source
   */
  revokeBySource(source: ObjectUrlEntry['source']): number {
    return this.revokeWhere(entry => entry.source === source);
  }

  /**
   * Revoke the oldest URL (LRU eviction)
   */
  revokeOldest(): boolean {
    let oldestUrl: string | null = null;
    let oldestTime = Infinity;

    this.urls.forEach((entry, url) => {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestUrl = url;
      }
    });

    if (oldestUrl) {
      return this.revoke(oldestUrl);
    }

    return false;
  }

  /**
   * Revoke all managed URLs
   */
  revokeAll(): number {
    const urls = Array.from(this.urls.keys());
    urls.forEach(url => this.revoke(url));
    return urls.length;
  }

  /**
   * Replace one URL with another (revokes old, creates new)
   * Returns the new URL
   */
  replace(oldUrl: string | undefined, newSource: File | Blob, options?: { source?: ObjectUrlEntry['source']; metadata?: Record<string, unknown> }): string {
    // Revoke old URL if it exists in this registry
    if (oldUrl && this.has(oldUrl)) {
      this.revoke(oldUrl);
    }

    return this.create(newSource, options);
  }

  /**
   * Get all active URLs
   */
  getAll(): ObjectUrlEntry[] {
    return Array.from(this.urls.values());
  }

  /**
   * Get all URLs matching a filter
   */
  getWhere(predicate: (entry: ObjectUrlEntry) => boolean): ObjectUrlEntry[] {
    return Array.from(this.urls.values()).filter(predicate);
  }

  /**
   * Get registry statistics
   */
  getStats(): RegistryStats {
    return {
      totalUrls: this.urls.size + this.revoked.size,
      activeUrls: this.urls.size,
      revokedUrls: this.revoked.size,
    };
  }

  /**
   * Check if URL has been revoked
   */
  isRevoked(url: string): boolean {
    return this.revoked.has(url);
  }

  /**
   * Clear revoked history (keeps active URLs)
   */
  clearRevokedHistory(): void {
    this.revoked.clear();
  }

  /**
   * Dispose the registry and revoke all URLs
   */
  dispose(): void {
    this.revokeAll();
    this.listeners.clear();
    this.revoked.clear();
  }
}

/**
 * Global singleton instance for app-wide URL management
 */
let globalRegistry: ObjectUrlRegistry | null = null;

export function getGlobalObjectUrlRegistry(): ObjectUrlRegistry {
  if (!globalRegistry) {
    globalRegistry = new ObjectUrlRegistry();
  }
  return globalRegistry;
}

export function resetGlobalObjectUrlRegistry(): void {
  if (globalRegistry) {
    globalRegistry.dispose();
    globalRegistry = null;
  }
}

/**
 * Utility to safely revoke a URL (handles cases where URL might not be from blob)
 */
export function safeRevokeObjectUrl(url: string | undefined): boolean {
  if (!url) return false;
  
  // Only revoke if it looks like a blob URL
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
    return true;
  }
  
  return false;
}

/**
 * Utility to create an object URL with automatic cleanup after timeout
 */
export function createTemporaryObjectUrl(
  source: File | Blob,
  ttlMs: number,
  registry?: ObjectUrlRegistry
): { url: string; cancel: () => void } {
  const reg = registry ?? getGlobalObjectUrlRegistry();
  const url = reg.create(source);
  
  const timeoutId = setTimeout(() => {
    reg.revoke(url);
  }, ttlMs);

  const cancel = () => {
    clearTimeout(timeoutId);
    reg.revoke(url);
  };

  return { url, cancel };
}

/**
 * Hook-like utility for managing a single object URL lifecycle
 */
export function createObjectUrlLifecycle(registry?: ObjectUrlRegistry) {
  const reg = registry ?? getGlobalObjectUrlRegistry();
  let currentUrl: string | undefined;

  return {
    /**
     * Set a new source, revoking any previous URL
     */
    set(source: File | Blob | undefined, options?: { source?: ObjectUrlEntry['source']; metadata?: Record<string, unknown> }): string | undefined {
      // Revoke previous URL if it exists
      if (currentUrl) {
        reg.revoke(currentUrl);
        currentUrl = undefined;
      }

      // Create new URL if source provided
      if (source) {
        currentUrl = reg.create(source, options);
      }

      return currentUrl;
    },

    /**
     * Get the current URL
     */
    get(): string | undefined {
      return currentUrl;
    },

    /**
     * Revoke the current URL
     */
    revoke(): boolean {
      if (currentUrl) {
        const result = reg.revoke(currentUrl);
        currentUrl = undefined;
        return result;
      }
      return false;
    },

    /**
     * Check if there's an active URL
     */
    hasActive(): boolean {
      return currentUrl !== undefined && reg.has(currentUrl);
    },
  };
}

export default {
  ObjectUrlRegistry,
  getGlobalObjectUrlRegistry,
  resetGlobalObjectUrlRegistry,
  safeRevokeObjectUrl,
  createTemporaryObjectUrl,
  createObjectUrlLifecycle,
};
