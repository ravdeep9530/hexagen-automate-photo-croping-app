import { grayscale, invert } from './wasm/index';

export async function grayscaleImage(data: Uint8Array, width: number, height: number): Promise<Uint8Array> {
  return grayscale(data, width, height);
}

export async function invertImage(data: Uint8Array, width: number, height: number): Promise<Uint8Array> {
  return invert(data, width, height);
}
