// Vitest setup file for DOM testing
import { vi } from 'vitest';

// Polyfill for URL.createObjectURL in jsdom
if (typeof globalThis.URL.createObjectURL === 'undefined') {
  Object.defineProperty(globalThis.URL, 'createObjectURL', {
    value: vi.fn(() => 'blob:mock-object-url'),
    writable: true,
    configurable: true,
  });
}

// Polyfill for URL.revokeObjectURL in jsdom
if (typeof globalThis.URL.revokeObjectURL === 'undefined') {
  Object.defineProperty(globalThis.URL, 'revokeObjectURL', {
    value: vi.fn(),
    writable: true,
    configurable: true,
  });
}

// Mock DataTransfer if not available (jsdom doesn't support it)
if (typeof globalThis.DataTransfer === 'undefined') {
  class MockDataTransfer {
    files: File[] = [];
    items = {
      add: (file: File) => {
        this.files.push(file);
      },
    };
    getData = () => '';
    setData = () => {};
    clearData = () => {};
  }
  Object.defineProperty(globalThis, 'DataTransfer', {
    value: MockDataTransfer,
    writable: true,
    configurable: true,
  });
}

// Mock ImageData if not available (might be needed for some test environments)
if (typeof globalThis.ImageData === 'undefined') {
  class MockImageData implements ImageData {
    data: Uint8ClampedArray;
    width: number;
    height: number;

    constructor(widthOrData: number | Uint8ClampedArray, widthOrHeight: number, height?: number) {
      if (widthOrData instanceof Uint8ClampedArray) {
        this.data = widthOrData;
        this.width = widthOrHeight;
        this.height = height ?? (widthOrData.length / 4 / widthOrHeight);
      } else {
        this.width = widthOrData;
        this.height = widthOrHeight ?? 0;
        this.data = new Uint8ClampedArray(this.width * (widthOrHeight ?? 1) * 4);
      }
    }
    colorSpace: PredefinedColorSpace = 'srgb';
  }
  Object.defineProperty(globalThis, 'ImageData', {
    value: MockImageData,
    writable: true,
    configurable: true,
  });
}
