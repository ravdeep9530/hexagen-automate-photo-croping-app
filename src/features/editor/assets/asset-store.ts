import type { ImageAsset, ImageMetadata, ValidationIssue } from '@/domain';
import {
  validateUpload,
  validateMimeType,
  validateFileSize,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_DIMENSION_PX,
  ValidationErrorCodes,
  createUploadValidationIssue,
} from './upload-validation';
import type { UploadValidationResult } from './upload-validation';
import { ObjectUrlRegistry } from './object-url-registry';

export { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES, MAX_DIMENSION_PX, ValidationErrorCodes };
export type { UploadValidationResult };

export interface AssetUploadOptions {
  signal?: AbortSignal;
  skipDecode?: boolean;
  replaceExisting?: boolean;
}

export interface AssetUploadResult {
  success: boolean;
  asset?: ImageAsset;
  objectUrl?: string;
  imageBitmap?: ImageBitmap;
  issues: ValidationIssue[];
}

export interface AssetStoreState {
  asset: ImageAsset | null;
  file: File | null;
  objectUrl: string | null;
  imageBitmap: ImageBitmap | null;
  issues: ValidationIssue[];
  isLoading: boolean;
}

export class AssetStore {
  private state: AssetStoreState = {
    asset: null,
    file: null,
    objectUrl: null,
    imageBitmap: null,
    issues: [],
    isLoading: false,
  };
  private listeners = new Set<(state: Readonly<AssetStoreState>) => void>();

  constructor(private readonly registry = new ObjectUrlRegistry()) {}

  subscribe(listener: (state: Readonly<AssetStoreState>) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState(): Readonly<AssetStoreState> {
    return { ...this.state };
  }

  async upload(file: File, options?: AssetUploadOptions): Promise<AssetUploadResult> {
    this.patch({ isLoading: true, issues: [] });
    try {
      const result = await validateUpload(file, { signal: options?.signal, skipDecode: options?.skipDecode });
      if (!result.valid) {
        this.patch({ isLoading: false, issues: result.issues });
        return { success: false, issues: result.issues };
      }

      if (options?.replaceExisting !== false) this.release();

      const objectUrl = this.registry.createFromFile(file);
      const asset = createImageAsset(file, result.width ?? 1, result.height ?? 1, objectUrl);
      this.patch({ asset, file, objectUrl, imageBitmap: result.imageBitmap ?? null, isLoading: false, issues: [] });
      return { success: true, asset, objectUrl, imageBitmap: result.imageBitmap, issues: [] };
    } catch (error) {
      const issue = createUploadValidationIssue(
        ValidationErrorCodes.DECODE_FAILED,
        error instanceof DOMException && error.name === 'AbortError' ? 'Upload was cancelled.' : 'The image upload could not be completed.',
        { error: error instanceof Error ? error.message : String(error) }
      );
      this.patch({ isLoading: false, issues: [issue] });
      return { success: false, issues: [issue] };
    }
  }

  async replace(file: File, options?: Omit<AssetUploadOptions, 'replaceExisting'>): Promise<AssetUploadResult> {
    this.release();
    return this.upload(file, { ...options, replaceExisting: false });
  }

  release(): void {
    if (this.state.objectUrl) this.registry.revoke(this.state.objectUrl);
    this.state.imageBitmap?.close?.();
    this.patch({ asset: null, file: null, objectUrl: null, imageBitmap: null, issues: [], isLoading: false });
  }

  dispose(): void {
    this.release();
    this.registry.dispose();
    this.listeners.clear();
  }

  getRegistry(): ObjectUrlRegistry {
    return this.registry;
  }

  private patch(next: Partial<AssetStoreState>): void {
    this.state = { ...this.state, ...next };
    this.listeners.forEach(listener => listener(this.getState()));
  }
}

export function quickValidateFile(file: File): { valid: boolean; issues: ValidationIssue[] } {
  const mime = validateMimeType(file);
  if (!mime.valid) return { valid: false, issues: mime.issues };
  const size = validateFileSize(file);
  if (!size.valid) return { valid: false, issues: size.issues };
  return { valid: true, issues: [] };
}

function createImageAsset(file: File, width: number, height: number, blobUrl: string): ImageAsset {
  const format = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpeg';
  const metadata: ImageMetadata = {
    width,
    height,
    aspectRatio: width / height,
    format,
    colorMode: 'unknown',
    hasAlpha: file.type === 'image/png' || file.type === 'image/webp',
    fileSizeBytes: file.size,
  };
  return {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `asset-${Date.now()}`,
    name: file.name,
    file,
    blobUrl,
    metadata,
    status: 'valid',
    uploadedAt: new Date().toISOString(),
  };
}

export function createAssetStore(registry?: ObjectUrlRegistry): AssetStore {
  return new AssetStore(registry);
}

export function getAcceptedImageTypes(): string {
  return ALLOWED_MIME_TYPES.join(',');
}
