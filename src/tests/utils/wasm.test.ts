import * as wasmUtils from '../../utils/wasm/index';
import * as imgProc from '../../utils/imageProcessing';

describe('WASM Image Processing Utilities', () => {
  it('should load WASM module and cache instance', async () => {
    // Mock fetch for WASM
    global.fetch = jest.fn(() => Promise.resolve({
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    })) as any;
    const exports1 = await wasmUtils.loadWasm();
    const exports2 = await wasmUtils.loadWasm();
    expect(exports1).toBe(exports2);
  });

  it('should expose grayscale utility', async () => {
    const input = new Uint8Array([10, 20, 30, 40]);
    const output = await wasmUtils.grayscale(input, 2, 2);
    expect(output).toEqual(input);
  });

  it('should expose invert utility', async () => {
    const input = new Uint8Array([0, 128, 255]);
    const output = await wasmUtils.invert(input, 1, 3);
    expect(output).toEqual(new Uint8Array([255, 127, 0]));
  });
});

describe('Image Processing API', () => {
  it('should call grayscaleImage and return result', async () => {
    const input = new Uint8Array([1,2,3,4]);
    const result = await imgProc.grayscaleImage(input, 2, 2);
    expect(result).toEqual(input);
  });

  it('should call invertImage and return inverted result', async () => {
    const input = new Uint8Array([0, 100, 200, 255]);
    const expected = new Uint8Array([255, 155, 55, 0]);
    const result = await imgProc.invertImage(input, 2, 2);
    expect(result).toEqual(expected);
  });
});
