import { vi } from 'vitest';

export const createMockFile = (overrides: { name?: string; type?: string; size?: number; lastModified?: number } = {}): File => {
  const { name = 'test-image.jpg', type = 'image/jpeg', size, lastModified = Date.now() } = overrides;
  const file = new File(['mock-file-content'], name, { type, lastModified });
  if (typeof size === 'number') Object.defineProperty(file, 'size', { value: size });
  return file;
};

export const createMockFileList = (files: File[] = [createMockFile()]): FileList => ({
  length: files.length,
  item: (index: number) => files[index] ?? null,
  ...files.reduce<Record<number, File>>((acc, file, index) => {
    acc[index] = file;
    return acc;
  }, {}),
} as FileList);

export const createMockImage = (): HTMLImageElement => document.createElement('img');

export const createMockImageBitmap = (overrides: Partial<ImageBitmap> = {}): ImageBitmap => ({
  width: overrides.width ?? 100,
  height: overrides.height ?? 100,
  close: vi.fn(),
  ...overrides,
} as ImageBitmap);

export const mockFileReader = (options: { result?: string | ArrayBuffer | null; error?: DOMException | null } = {}) => {
  const mockReader = {
    result: options.result ?? 'data:image/jpeg;base64,mock',
    error: options.error ?? null,
    readyState: 2,
    onload: null as ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null,
    onerror: null as ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null,
    readAsDataURL: vi.fn(function (this: typeof mockReader) {
      setTimeout(() => {
        if (this.error) this.onerror?.(new ProgressEvent('error') as ProgressEvent<FileReader>);
        else this.onload?.(new ProgressEvent('load') as ProgressEvent<FileReader>);
      }, 0);
    }),
    readAsArrayBuffer: vi.fn(),
    readAsText: vi.fn(),
    readAsBinaryString: vi.fn(),
    abort: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  const originalFileReader = globalThis.FileReader;
  globalThis.FileReader = vi.fn(() => mockReader) as unknown as typeof FileReader;
  return { mockReader, restore: () => { globalThis.FileReader = originalFileReader; } };
};

export const mockFetchImage = (options: { ok?: boolean; blob?: Blob; error?: Error } = {}) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = vi.fn(async () => {
    if (options.error) throw options.error;
    return { ok: options.ok ?? true, blob: async () => options.blob ?? new Blob(['mock'], { type: 'image/jpeg' }), arrayBuffer: async () => new ArrayBuffer(0) } as Response;
  }) as unknown as typeof fetch;
  return { restore: () => { globalThis.fetch = originalFetch; } };
};
