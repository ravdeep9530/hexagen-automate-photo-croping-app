import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateMimeType,
  validateFileSize,
  validateImageDimensions,
  validateUpload,
  decodeImage,
  formatFileSize,
  isSupportedMimeType,
  isCreateImageBitmapSupported,
  getAcceptedFileTypes,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_DIMENSION_PX,
  ValidationErrorCodes,
} from '../upload-validation';

const createMockFile = (overrides: Partial<File> = {}): File => {
  return {
    name: overrides.name ?? 'test.jpg',
    type: overrides.type ?? 'image/jpeg',
    size: overrides.size ?? 1024,
    lastModified: Date.now(),
    slice: vi.fn(),
    stream: vi.fn(),
    text: vi.fn(),
    arrayBuffer: vi.fn(),
    bytes: vi.fn(),
    ...overrides,
  } as unknown as File;
};

describe('upload-validation', () => {
  describe('validateMimeType', () => {
    it('should accept valid JPEG files', () => {
      const file = createMockFile({ type: 'image/jpeg', name: 'photo.jpg' });
      const result = validateMimeType(file);
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should accept valid PNG files', () => {
      const file = createMockFile({ type: 'image/png', name: 'photo.png' });
      const result = validateMimeType(file);
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should accept valid WEBP files', () => {
      const file = createMockFile({ type: 'image/webp', name: 'photo.webp' });
      const result = validateMimeType(file);
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should reject invalid MIME types', () => {
      const file = createMockFile({ type: 'image/gif', name: 'animation.gif' });
      const result = validateMimeType(file);
      expect(result.valid).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toMatchObject({
        type: 'format',
        severity: 'error',
      });
    });

    it('should reject non-image MIME types', () => {
      const file = createMockFile({ type: 'application/pdf', name: 'doc.pdf' });
      const result = validateMimeType(file);
      expect(result.valid).toBe(false);
      expect(result.issues[0]).toMatchObject({
        type: 'format',
        severity: 'error',
      });
    });

    it('should handle case-insensitive MIME type matching', () => {
      const file = createMockFile({ type: 'IMAGE/JPEG', name: 'photo.jpg' });
      const result = validateMimeType(file);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateFileSize', () => {
    it('should accept files under 20MB', () => {
      const file = createMockFile({ size: 10 * 1024 * 1024 });
      const result = validateFileSize(file);
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should accept files exactly at 20MB limit', () => {
      const file = createMockFile({ size: MAX_FILE_SIZE_BYTES });
      const result = validateFileSize(file);
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should reject files over 20MB', () => {
      const file = createMockFile({ size: 25 * 1024 * 1024 });
      const result = validateFileSize(file);
      expect(result.valid).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toMatchObject({
        type: 'file-size',
        severity: 'error',
      });
    });

    it('should include file size details in error', () => {
      const fileSize = 30 * 1024 * 1024;
      const file = createMockFile({ size: fileSize });
      const result = validateFileSize(file);
      expect(result.issues[0].details).toMatchObject({
        fileSizeBytes: fileSize,
        maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
      });
    });
  });

  describe('validateImageDimensions', () => {
    it('should accept dimensions under 8000x8000', () => {
      const result = validateImageDimensions(4000, 3000);
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should accept dimensions exactly at 8000x8000 limit', () => {
      const result = validateImageDimensions(MAX_DIMENSION_PX, MAX_DIMENSION_PX);
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should reject width over 8000 pixels', () => {
      const result = validateImageDimensions(8500, 4000);
      expect(result.valid).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toMatchObject({
        type: 'dimension',
        severity: 'error',
      });
    });

    it('should reject height over 8000 pixels', () => {
      const result = validateImageDimensions(4000, 8500);
      expect(result.valid).toBe(false);
      expect(result.issues).toHaveLength(1);
    });

    it('should reject both dimensions over limit', () => {
      const result = validateImageDimensions(10000, 9000);
      expect(result.valid).toBe(false);
      expect(result.issues).toHaveLength(1);
    });
  });

  describe('isCreateImageBitmapSupported', () => {
    it('should return true when createImageBitmap is available', () => {
      globalThis.createImageBitmap = vi.fn();
      expect(isCreateImageBitmapSupported()).toBe(true);
      delete (globalThis as { createImageBitmap?: unknown }).createImageBitmap;
    });

    it('should return false when createImageBitmap is not available', () => {
      delete (globalThis as { createImageBitmap?: unknown }).createImageBitmap;
      expect(isCreateImageBitmapSupported()).toBe(false);
    });
  });

  describe('decodeImage', () => {
    let mockImageBitmap: ImageBitmap;
    let createImageBitmapSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockImageBitmap = {
        width: 1000,
        height: 750,
        close: vi.fn(),
      } as unknown as ImageBitmap;
      createImageBitmapSpy = vi.fn().mockResolvedValue(mockImageBitmap);
      globalThis.createImageBitmap = createImageBitmapSpy;
    });

    afterEach(() => {
      delete (globalThis as { createImageBitmap?: unknown }).createImageBitmap;
    });

    it('should decode image using createImageBitmap when available', async () => {
      const file = createMockFile();
      const result = await decodeImage(file);

      expect(createImageBitmapSpy).toHaveBeenCalledWith(file);
      expect(result).toEqual({
        width: 1000,
        height: 750,
        imageBitmap: mockImageBitmap,
      });
    });

    it('should throw AbortError when signal is aborted before decode', async () => {
      const file = createMockFile();
      const controller = new AbortController();
      controller.abort();

      await expect(decodeImage(file, controller.signal)).rejects.toThrow(DOMException);
    });

    it('should close ImageBitmap and throw when signal aborted after decode', async () => {
      const file = createMockFile();
      const controller = new AbortController();

      createImageBitmapSpy.mockImplementation(() => {
        controller.abort();
        return Promise.resolve(mockImageBitmap);
      });

      await expect(decodeImage(file, controller.signal)).rejects.toThrow('aborted');
      expect(mockImageBitmap.close).toHaveBeenCalled();
    });
  });

  describe('validateUpload', () => {
    let mockImageBitmap: ImageBitmap;

    beforeEach(() => {
      mockImageBitmap = {
        width: 1000,
        height: 750,
        close: vi.fn(),
      } as unknown as ImageBitmap;
      globalThis.createImageBitmap = vi.fn().mockResolvedValue(mockImageBitmap);
      // Mock URL.createObjectURL
      globalThis.URL = {
        createObjectURL: vi.fn().mockReturnValue('blob:mock-url'),
        revokeObjectURL: vi.fn(),
      } as unknown as typeof URL;
    });

    afterEach(() => {
      delete (globalThis as { createImageBitmap?: unknown }).createImageBitmap;
    });

    it('should validate a valid upload successfully', async () => {
      const file = createMockFile({ type: 'image/jpeg', size: 1024 * 1024 });
      const result = await validateUpload(file);

      expect(result.valid).toBe(true);
      expect(result.file).toBe(file);
      expect(result.mimeType).toBe('image/jpeg');
      expect(result.width).toBe(1000);
      expect(result.height).toBe(750);
      expect(result.issues).toHaveLength(0);
    });

    it('should reject upload with invalid MIME type', async () => {
      const file = createMockFile({ type: 'image/gif' });
      const result = await validateUpload(file);

      expect(result.valid).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('format');
    });

    it('should reject upload with file size exceeding limit', async () => {
      const file = createMockFile({ type: 'image/jpeg', size: 25 * 1024 * 1024 });
      const result = await validateUpload(file);

      expect(result.valid).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('file-size');
    });

    it('should reject upload with dimensions exceeding limit', async () => {
      const largeMockBitmap = {
        width: 10000,
        height: 9000,
        close: vi.fn(),
      } as unknown as ImageBitmap;
      globalThis.createImageBitmap = vi.fn().mockResolvedValue(largeMockBitmap);

      const file = createMockFile({ type: 'image/jpeg' });
      const result = await validateUpload(file);

      expect(result.valid).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('dimension');
      expect(largeMockBitmap.close).toHaveBeenCalled();
    });

    it('should skip decode when skipDecode option is true', async () => {
      const file = createMockFile();
      const result = await validateUpload(file, { skipDecode: true });

      expect(result.valid).toBe(true);
      expect(result.width).toBeUndefined();
      expect(result.height).toBeUndefined();
    });

    it('should abort upload when signal is triggered', async () => {
      const file = createMockFile();
      const controller = new AbortController();
      controller.abort();

      await expect(validateUpload(file, { signal: controller.signal })).rejects.toThrow('aborted');
    });

    it('should return decode failure issue when decoding fails', async () => {
      globalThis.createImageBitmap = vi.fn().mockRejectedValue(new Error('Decode failed'));

      const file = createMockFile();
      const result = await validateUpload(file);

      expect(result.valid).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].details?.code).toBe(ValidationErrorCodes.DECODE_FAILED);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(512)).toBe('512 B');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(10 * 1024 * 1024)).toBe('10 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should handle decimal places correctly', () => {
      const result = formatFileSize(1500);
      expect(result).toContain('.');
      expect(result).toContain('KB');
    });
  });

  describe('isSupportedMimeType', () => {
    it('should return true for supported MIME types', () => {
      expect(isSupportedMimeType('image/jpeg')).toBe(true);
      expect(isSupportedMimeType('image/png')).toBe(true);
      expect(isSupportedMimeType('image/webp')).toBe(true);
    });

    it('should return false for unsupported MIME types', () => {
      expect(isSupportedMimeType('image/gif')).toBe(false);
      expect(isSupportedMimeType('image/bmp')).toBe(false);
      expect(isSupportedMimeType('application/pdf')).toBe(false);
    });

    it('should handle case-insensitive checks', () => {
      expect(isSupportedMimeType('IMAGE/JPEG')).toBe(true);
      expect(isSupportedMimeType('Image/Png')).toBe(true);
    });
  });

  describe('getAcceptedFileTypes', () => {
    it('should return comma-separated MIME types', () => {
      const result = getAcceptedFileTypes();
      expect(result).toBe('image/jpeg,image/png,image/webp');
      expect(result).toContain('image/jpeg');
      expect(result).toContain('image/png');
      expect(result).toContain('image/webp');
    });
  });
});
