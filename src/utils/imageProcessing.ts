import { wasmInvertImage, wasmGrayscaleImage } from './wasm/index';

export async function invertImage(imageData: Uint8Array): Promise<Uint8Array> {
  return await wasmInvertImage(imageData);
}

export async function grayscaleImage(imageData: Uint8Array): Promise<Uint8Array> {
  return await wasmGrayscaleImage(imageData);
}
