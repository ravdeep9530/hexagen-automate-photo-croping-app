import { vi } from 'vitest';

export type MockCanvasBlobOptions = {
  type?: string;
  contents?: BlobPart[];
};

export const installCanvasMocks = (options: MockCanvasBlobOptions = {}) => {
  const blobType = options.type ?? 'image/jpeg';
  const blobContents = options.contents ?? ['mock-canvas-export'];

  const context = {
    canvas: undefined as HTMLCanvasElement | undefined,
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    fillRect: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 })),
    putImageData: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    translate: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    rect: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    setTransform: vi.fn(),
    resetTransform: vi.fn(),
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high' as ImageSmoothingQuality,
    fillStyle: '#fff',
    strokeStyle: '#000',
    lineWidth: 1,
  };

  const getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function getContext() {
    context.canvas = this as HTMLCanvasElement;
    return context as unknown as CanvasRenderingContext2D;
  });

  const toBlobSpy = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function toBlob(callback, type) {
    callback(new Blob(blobContents, { type: type || blobType }));
  });

  const toDataURLSpy = vi
    .spyOn(HTMLCanvasElement.prototype, 'toDataURL')
    .mockImplementation((type?: string) => `data:${type || blobType};base64,bW9jay1jYW52YXM=`);

  return {
    context,
    getContextSpy,
    toBlobSpy,
    toDataURLSpy,
    restore: () => {
      getContextSpy.mockRestore();
      toBlobSpy.mockRestore();
      toDataURLSpy.mockRestore();
    },
  };
};
