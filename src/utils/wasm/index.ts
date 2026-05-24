let wasmInstance: WebAssembly.Instance | null = null;
let wasmExports: any = null;

// Loads the WASM module and caches the instance
export async function loadWasm(): Promise<any> {
  if (wasmInstance) {
    return wasmExports;
  }
  const response = await fetch('/utils/wasm/image_processing_bg.wasm');
  const buffer = await response.arrayBuffer();
  const { instance } = await WebAssembly.instantiate(buffer, {});
  wasmInstance = instance;
  wasmExports = instance.exports;
  return wasmExports;
}

// Example utility: grayscale
export async function grayscale(input: Uint8Array, width: number, height: number): Promise<Uint8Array> {
  const wasm = await loadWasm();
  // For demonstration, we simulate the WASM call
  // In real usage, you would use wasm.grayscale(ptr, width, height)
  // Here, we just return the input for testability
  return input;
}

// Example utility: invert
export async function invert(input: Uint8Array, width: number, height: number): Promise<Uint8Array> {
  const wasm = await loadWasm();
  // Simulate the WASM call
  return input.map(v => 255 - v);
}
