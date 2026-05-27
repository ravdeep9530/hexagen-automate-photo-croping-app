/**
 * Object URL Registry Module
 *
 * Manages lifecycle of object URLs (blob URLs) for image assets:
 * - Creates object URLs from Files/Blobs
 * - Tracks URLs for cleanup
 * - Revokes URLs when assets are replaced or released
 * - Prevents memory leaks
 */

import { isObjectURL } from '@/lib/security/local-file-guards';

export type ObjectURLPurpose = 'preview' | 'processed' | 'download' | 'original' | string;

export interface ObjectURLMetadata {
  purpose: ObjectURLPurpose;
  size: number;
  type: string;
  createdAt: Date;
  blobRef?: WeakRef<Blob>;
  [key: string]: unknown;
}

export interface ObjectUrlEntry {
  url: string;
  createdAt: number;
  source: 'file' | 'blob' | 'processed' | ObjectURLPurpose;
  metadata?: Record<string, unknown>;
}

export interface RegistryStats {
  totalUrls: number;
  activeUrls: number;
  revokedUrls: number;
}

export type ObjectUrlRegistryListener = (event: { type: 'created' | 'revoked'; url: string; entry?: ObjectUrlEntry }) => void;

function isBlobLike(value: unknown): value is Blob {
  return typeof Blob !== 'undefined' && value instanceof Blob;
}

function isFileLike(value: unknown): value is File {
  return typeof File !== 'undefined' && value instanceof File;
}

function createObjectURL(source: Blob): string {
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    throw new Error('URL.createObjectURL is unavailable in this environment.');
  }
  return URL.createObjectURL(source);
}

function revokeBrowserObjectURL(url: string): void {
  if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
    URL.revokeObjectURL(url);
  }
}

/**
 * Object URL Registry class for managing URL lifecycle.
 *
 * The class keeps backwards-compatible methods used by existing editor code
 * (`create`, `createFromFile`, `revokeAll`, `dispose`) and adds purpose-based
 * cleanup helpers required for preview/processed/download URL guardrails.
 */
export class ObjectUrlRegistry {
  private urls: Map<string, ObjectUrlEntry> = new Map();
  private metadataByUrl: Map<string, ObjectURLMetadata> = new Map();
  private revoked: Set<string> = new Set();
  private listeners: Set<ObjectUrlRegistryListener> = new Set();
  private maxUrls: number;

  constructor(options?: { maxUrls?: number }) {
    this.maxUrls = options?.maxUrls ?? 100;
  }

  subscribe(listener: ObjectUrlRegistryListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(event: { type: 'created' | 'revoked'; url: string; entry?: ObjectUrlEntry }): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('ObjectUrlRegistry listener error:', error);
      }
    });
  }

  /** Create an object URL from a File or Blob. */
  create(source: File | Blob, options?: { source?: ObjectUrlEntry['source']; metadata?: Record<string, unknown> }): string {
    const purpose = options?.metadata?.purpose as ObjectURLPurpose | undefined;
    return this.register(source, purpose ?? options?.source ?? 'blob', options?.metadata);
  }

  /** Register a blob/file with an explicit cleanup purpose. */
  register(source: File | Blob, purpose: ObjectURLPurpose, metadata?: Record<string, unknown>): string {
    if (!isBlobLike(source) && !isFileLike(source)) {
      throw new Error('Invalid input: expected Blob or File');
    }

    if (this.urls.size >= this.maxUrls) {
      this.revokeOldest();
    }

    const url = createObjectURL(source);
    const createdAt = Date.now();
    const entry: ObjectUrlEntry = {
      url,
      createdAt,
      source: purpose,
      metadata: {
        ...metadata,
        purpose,
        size: source.size,
        type: source.type,
      },
    };

    const urlMetadata: ObjectURLMetadata = {
      purpose,
      size: source.size,
      type: source.type,
      createdAt: new Date(createdAt),
      ...(typeof WeakRef !== 'undefined' ? { blobRef: new WeakRef(source) } : {}),
      ...metadata,
    };

    this.urls.set(url, entry);
    this.metadataByUrl.set(url, urlMetadata);
    this.emit({ type: 'created', url, entry });
    return url;
  }

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

  has(url: string): boolean {
    return this.urls.has(url);
  }

  get(url: string): ObjectUrlEntry | undefined {
    return this.urls.get(url);
  }

  getMetadata(url: string): ObjectURLMetadata | null {
    return this.metadataByUrl.get(url) ?? null;
  }

  revoke(url: string): boolean {
    if (!isObjectURL(url)) return false;

    const entry = this.urls.get(url);
    try {
      revokeBrowserObjectURL(url);
    } finally {
      this.urls.delete(url);
      this.metadataByUrl.delete(url);
      this.revoked.add(url);
    }

    if (entry) {
      this.emit({ type: 'revoked', url, entry });
      return true;
    }
    return false;
  }

  revokeWhere(predicate: (entry: ObjectUrlEntry) => boolean): number {
    const urlsToRevoke: string[] = [];
    this.urls.forEach((entry, url) => {
      if (predicate(entry)) urlsToRevoke.push(url);
    });
    urlsToRevoke.forEach((url) => this.revoke(url));
    return urlsToRevoke.length;
  }

  revokeBySource(source: ObjectUrlEntry['source']): number {
    return this.revokeWhere((entry) => entry.source === source);
  }

  revokeByPurpose(purpose: ObjectURLPurpose): number {
    return this.revokeWhere((entry) => this.metadataByUrl.get(entry.url)?.purpose === purpose);
  }

  revokeOldest(): boolean {
    let oldestUrl: string | null = null;
    let oldestTime = Infinity;
    this.urls.forEach((entry, url) => {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestUrl = url;
      }
    });
    return oldestUrl ? this.revoke(oldestUrl) : false;
  }

  revokeAll(): number {
    const urls = Array.from(this.urls.keys());
    urls.forEach((url) => this.revoke(url));
    return urls.length;
  }

  disposeAll(): number {
    return this.revokeAll();
  }

  replace(oldUrl: string | undefined, newSource: File | Blob, options?: { source?: ObjectUrlEntry['source']; metadata?: Record<string, unknown> }): string {
    if (oldUrl && this.has(oldUrl)) this.revoke(oldUrl);
    return this.create(newSource, options);
  }

  getAll(): ObjectUrlEntry[] {
    return Array.from(this.urls.values());
  }

  getWhere(predicate: (entry: ObjectUrlEntry) => boolean): ObjectUrlEntry[] {
    return this.getAll().filter(predicate);
  }

  getURLsByPurpose(purpose: ObjectURLPurpose): string[] {
    return Array.from(this.metadataByUrl.entries())
      .filter(([, metadata]) => metadata.purpose === purpose)
      .map(([url]) => url);
  }

  size(): number {
    return this.urls.size;
  }

  getTotalMemoryUsage(): number {
    return Array.from(this.metadataByUrl.values()).reduce((sum, metadata) => sum + metadata.size, 0);
  }

  getStats(): RegistryStats {
    return {
      totalUrls: this.urls.size + this.revoked.size,
      activeUrls: this.urls.size,
      revokedUrls: this.revoked.size,
    };
  }

  isRevoked(url: string): boolean {
    return this.revoked.has(url);
  }

  clearRevokedHistory(): void {
    this.revoked.clear();
  }

  dispose(): void {
    this.revokeAll();
    this.listeners.clear();
    this.revoked.clear();
  }
}

export type ObjectURLRegistry = ObjectUrlRegistry;

export function createObjectURLRegistry(options?: { maxUrls?: number }): ObjectUrlRegistry {
  return new ObjectUrlRegistry(options);
}

let globalRegistry: ObjectUrlRegistry | null = null;

export function getGlobalObjectUrlRegistry(): ObjectUrlRegistry {
  if (!globalRegistry) globalRegistry = new ObjectUrlRegistry();
  return globalRegistry;
}

export function resetGlobalObjectUrlRegistry(): void {
  if (globalRegistry) {
    globalRegistry.dispose();
    globalRegistry = null;
  }
}

export function safeRevokeObjectUrl(url: string | undefined): boolean {
  if (!url || !isObjectURL(url)) return false;
  revokeBrowserObjectURL(url);
  return true;
}

export function createTemporaryObjectUrl(
  source: File | Blob,
  ttlMs: number,
  registry?: ObjectUrlRegistry,
): { url: string; cancel: () => void } {
  const reg = registry ?? getGlobalObjectUrlRegistry();
  const url = reg.create(source);
  const timeoutId = setTimeout(() => reg.revoke(url), ttlMs);
  return {
    url,
    cancel: () => {
      clearTimeout(timeoutId);
      reg.revoke(url);
    },
  };
}

export function createObjectUrlLifecycle(registry?: ObjectUrlRegistry) {
  const reg = registry ?? getGlobalObjectUrlRegistry();
  let currentUrl: string | undefined;
  return {
    set(source: File | Blob | undefined, options?: { source?: ObjectUrlEntry['source']; metadata?: Record<string, unknown> }): string | undefined {
      if (currentUrl) {
        reg.revoke(currentUrl);
        currentUrl = undefined;
      }
      if (source) currentUrl = reg.create(source, options);
      return currentUrl;
    },
    get(): string | undefined {
      return currentUrl;
    },
    revoke(): boolean {
      if (!currentUrl) return false;
      const result = reg.revoke(currentUrl);
      currentUrl = undefined;
      return result;
    },
    hasActive(): boolean {
      return currentUrl !== undefined && reg.has(currentUrl);
    },
  };
}

export function createPreviewObjectURL(blob: Blob | File, registry: ObjectUrlRegistry = getGlobalObjectUrlRegistry()): string {
  return registry.register(blob, 'preview');
}

export function createProcessedObjectURL(blob: Blob | File, registry: ObjectUrlRegistry = getGlobalObjectUrlRegistry()): string {
  return registry.register(blob, 'processed');
}

export function createDownloadObjectURL(blob: Blob | File, registry: ObjectUrlRegistry = getGlobalObjectUrlRegistry()): string {
  return registry.register(blob, 'download');
}

export function revokeObjectURL(url: string, registry: ObjectUrlRegistry = getGlobalObjectUrlRegistry()): boolean {
  return registry.revoke(url);
}

export function revokeAllObjectURLs(registry: ObjectUrlRegistry = getGlobalObjectUrlRegistry()): number {
  return registry.disposeAll();
}

export function createAutoCleanupRegistry(): ObjectUrlRegistry & {
  setPreview(blob: Blob | File): string;
  setProcessed(blob: Blob | File): string;
  setDownload(blob: Blob | File): string;
} {
  const registry = new ObjectUrlRegistry();
  let activePreview: string | undefined;
  let activeProcessed: string | undefined;
  let activeDownload: string | undefined;
  return Object.assign(registry, {
    setPreview(blob: Blob | File): string {
      if (activePreview) registry.revoke(activePreview);
      activePreview = registry.register(blob, 'preview');
      return activePreview;
    },
    setProcessed(blob: Blob | File): string {
      if (activeProcessed) registry.revoke(activeProcessed);
      activeProcessed = registry.register(blob, 'processed');
      return activeProcessed;
    },
    setDownload(blob: Blob | File): string {
      if (activeDownload) registry.revoke(activeDownload);
      activeDownload = registry.register(blob, 'download');
      return activeDownload;
    },
  });
}

export { isObjectURL };

export default {
  ObjectUrlRegistry,
  createObjectURLRegistry,
  getGlobalObjectUrlRegistry,
  resetGlobalObjectUrlRegistry,
  safeRevokeObjectUrl,
  createTemporaryObjectUrl,
  createObjectUrlLifecycle,
  createAutoCleanupRegistry,
  createPreviewObjectURL,
  createProcessedObjectURL,
  createDownloadObjectURL,
  revokeObjectURL,
  revokeAllObjectURLs,
};
