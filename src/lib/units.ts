/**
 * Unit conversion utilities for dimensions and DPI
 * 
 * This module provides deterministic rounding behavior for all conversions
 * to ensure consistent results across the application.
 */

// Constants for conversion
const MM_PER_INCH = 25.4;
const INCHES_PER_MM = 1 / MM_PER_INCH;

// Default DPI for conversions when not specified
const DEFAULT_DPI = 300;

// Default rounding precision
const DEFAULT_DECIMAL_PLACES = 2;

/**
 * Rounding mode options
 */
export type RoundingMode = 'nearest' | 'floor' | 'ceil' | 'trunc';

/**
 * Round a number with specified precision and mode
 */
export function roundPrecision(
  value: number,
  decimalPlaces: number = DEFAULT_DECIMAL_PLACES,
  mode: RoundingMode = 'nearest'
): number {
  const multiplier = Math.pow(10, decimalPlaces);
  
  switch (mode) {
    case 'floor':
      return Math.floor(value * multiplier) / multiplier;
    case 'ceil':
      return Math.ceil(value * multiplier) / multiplier;
    case 'trunc':
      return Math.trunc(value * multiplier) / multiplier;
    case 'nearest':
    default:
      return Math.round(value * multiplier) / multiplier;
  }
}

/**
 * Dimensions in various units
 */
export interface Dimensions {
  width: number;
  height: number;
}

/**
 * Convert millimeters to inches
 */
export function mmToInches(mm: number, decimalPlaces?: number): number {
  const inches = mm * INCHES_PER_MM;
  return decimalPlaces !== undefined ? roundPrecision(inches, decimalPlaces) : inches;
}

/**
 * Convert inches to millimeters
 */
export function inchesToMm(inches: number, decimalPlaces?: number): number {
  const mm = inches * MM_PER_INCH;
  return decimalPlaces !== undefined ? roundPrecision(mm, decimalPlaces) : mm;
}

/**
 * Convert millimeters to pixels at a given DPI
 */
export function mmToPx(mm: number, dpi: number = DEFAULT_DPI, decimalPlaces?: number): number {
  const inches = mm * INCHES_PER_MM;
  const pixels = inches * dpi;
  return decimalPlaces !== undefined ? roundPrecision(pixels, decimalPlaces) : pixels;
}

/**
 * Convert pixels to millimeters at a given DPI
 */
export function pxToMm(px: number, dpi: number = DEFAULT_DPI, decimalPlaces?: number): number {
  const inches = px / dpi;
  const mm = inches * MM_PER_INCH;
  return decimalPlaces !== undefined ? roundPrecision(mm, decimalPlaces) : mm;
}

/**
 * Convert inches to pixels at a given DPI
 */
export function inchesToPx(inches: number, dpi: number = DEFAULT_DPI, decimalPlaces?: number): number {
  const pixels = inches * dpi;
  return decimalPlaces !== undefined ? roundPrecision(pixels, decimalPlaces) : pixels;
}

/**
 * Convert pixels to inches at a given DPI
 */
export function pxToInches(px: number, dpi: number = DEFAULT_DPI, decimalPlaces?: number): number {
  const inches = px / dpi;
  return decimalPlaces !== undefined ? roundPrecision(inches, decimalPlaces) : inches;
}

/**
 * Convert dimensions from millimeters to inches
 */
export function dimensionsMmToInches(
  dims: Dimensions,
  decimalPlaces?: number
): Dimensions {
  return {
    width: mmToInches(dims.width, decimalPlaces),
    height: mmToInches(dims.height, decimalPlaces),
  };
}

/**
 * Convert dimensions from inches to millimeters
 */
export function dimensionsInchesToMm(
  dims: Dimensions,
  decimalPlaces?: number
): Dimensions {
  return {
    width: inchesToMm(dims.width, decimalPlaces),
    height: inchesToMm(dims.height, decimalPlaces),
  };
}

/**
 * Convert dimensions from millimeters to pixels at a given DPI
 */
export function dimensionsMmToPx(
  dims: Dimensions,
  dpi: number = DEFAULT_DPI,
  decimalPlaces?: number
): Dimensions {
  return {
    width: mmToPx(dims.width, dpi, decimalPlaces),
    height: mmToPx(dims.height, dpi, decimalPlaces),
  };
}

/**
 * Convert dimensions from pixels to millimeters at a given DPI
 */
export function dimensionsPxToMm(
  dims: Dimensions,
  dpi: number = DEFAULT_DPI,
  decimalPlaces?: number
): Dimensions {
  return {
    width: pxToMm(dims.width, dpi, decimalPlaces),
    height: pxToMm(dims.height, dpi, decimalPlaces),
  };
}

/**
 * Convert dimensions from inches to pixels at a given DPI
 */
export function dimensionsInchesToPx(
  dims: Dimensions,
  dpi: number = DEFAULT_DPI,
  decimalPlaces?: number
): Dimensions {
  return {
    width: inchesToPx(dims.width, dpi, decimalPlaces),
    height: inchesToPx(dims.height, dpi, decimalPlaces),
  };
}

/**
 * Convert dimensions from pixels to inches at a given DPI
 */
export function dimensionsPxToInches(
  dims: Dimensions,
  dpi: number = DEFAULT_DPI,
  decimalPlaces?: number
): Dimensions {
  return {
    width: pxToInches(dims.width, dpi, decimalPlaces),
    height: pxToInches(dims.height, dpi, decimalPlaces),
  };
}

/**
 * Calculate DPI from pixel dimensions and physical size in mm
 */
export function calculateDpiFromMm(
  widthPx: number,
  heightPx: number,
  widthMm: number,
  heightMm: number,
  decimalPlaces: number = 2
): { horizontalDpi: number; verticalDpi: number } {
  const horizontalDpi = widthPx / (widthMm * INCHES_PER_MM);
  const verticalDpi = heightPx / (heightMm * INCHES_PER_MM);
  
  return {
    horizontalDpi: roundPrecision(horizontalDpi, decimalPlaces),
    verticalDpi: roundPrecision(verticalDpi, decimalPlaces),
  };
}

/**
 * Calculate DPI from pixel dimensions and physical size in inches
 */
export function calculateDpiFromInches(
  widthPx: number,
  heightPx: number,
  widthInches: number,
  heightInches: number,
  decimalPlaces: number = 2
): { horizontalDpi: number; verticalDpi: number } {
  const horizontalDpi = widthPx / widthInches;
  const verticalDpi = heightPx / heightInches;
  
  return {
    horizontalDpi: roundPrecision(horizontalDpi, decimalPlaces),
    verticalDpi: roundPrecision(verticalDpi, decimalPlaces),
  };
}

/**
 * Calculate pixel dimensions from physical size and DPI
 */
export function calculatePxFromPhysicalSize(
  widthMm: number,
  heightMm: number,
  dpi: number = DEFAULT_DPI,
  roundToInt: boolean = true
): Dimensions & { totalPixels: number; megapixels: number } {
  const widthPx = widthMm * INCHES_PER_MM * dpi;
  const heightPx = heightMm * INCHES_PER_MM * dpi;
  
  const finalWidth = roundToInt ? Math.round(widthPx) : widthPx;
  const finalHeight = roundToInt ? Math.round(heightPx) : heightPx;
  const totalPixels = finalWidth * finalHeight;
  
  return {
    width: finalWidth,
    height: finalHeight,
    totalPixels,
    megapixels: roundPrecision(totalPixels / 1_000_000, 3),
  };
}

/**
 * Calculate physical size from pixel dimensions and DPI
 */
export function calculatePhysicalSizeFromPx(
  widthPx: number,
  heightPx: number,
  dpi: number = DEFAULT_DPI,
  decimalPlaces: number = 2
): Dimensions & { aspectRatio: number; diagonalMm: number; diagonalInches: number } {
  const widthMm = pxToMm(widthPx, dpi);
  const heightMm = pxToMm(heightPx, dpi);
  
  const widthInches = widthMm * INCHES_PER_MM;
  const heightInches = heightMm * INCHES_PER_MM;
  const diagonalInches = Math.sqrt(widthInches ** 2 + heightInches ** 2);
  
  return {
    width: roundPrecision(widthMm, decimalPlaces),
    height: roundPrecision(heightMm, decimalPlaces),
    aspectRatio: roundPrecision(widthPx / heightPx, 4),
    diagonalMm: roundPrecision(diagonalInches * MM_PER_INCH, decimalPlaces),
    diagonalInches: roundPrecision(diagonalInches, decimalPlaces),
  };
}

/**
 * Calculate aspect ratio from dimensions
 */
export function calculateAspectRatio(
  width: number,
  height: number,
  decimalPlaces: number = 4
): number {
  return roundPrecision(width / height, decimalPlaces);
}

/**
 * Convert megapixels to dimensions (assuming square aspect ratio)
 */
export function megapixelsToDimensions(
  megapixels: number,
  aspectRatio: number = 1
): { width: number; height: number; widthPx: number; heightPx: number } {
  const totalPixels = megapixels * 1_000_000;
  const heightPx = Math.sqrt(totalPixels / aspectRatio);
  const widthPx = heightPx * aspectRatio;
  
  return {
    width: Math.round(widthPx),
    height: Math.round(heightPx),
    widthPx: Math.round(widthPx),
    heightPx: Math.round(heightPx),
  };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${roundPrecision(size, 2)} ${units[unitIndex]}`;
}

/**
 * Format dimensions for display
 */
export function formatDimensions(
  dims: Dimensions,
  unit: 'px' | 'mm' | 'in' = 'px'
): string {
  return `${roundPrecision(dims.width, 2)}${unit} × ${roundPrecision(dims.height, 2)}${unit}`;
}

/**
 * Check if dimensions roughly match within tolerance
 */
export function dimensionsMatch(
  a: Dimensions,
  b: Dimensions,
  tolerance: number = 0.01
): boolean {
  const widthDiff = Math.abs(a.width - b.width) / Math.max(a.width, b.width);
  const heightDiff = Math.abs(a.height - b.height) / Math.max(a.height, b.height);
  return widthDiff <= tolerance && heightDiff <= tolerance;
}

/**
 * Scale dimensions by a factor
 */
export function scaleDimensions(
  dims: Dimensions,
  scale: number,
  roundToInt: boolean = false
): Dimensions {
  return {
    width: roundToInt ? Math.round(dims.width * scale) : dims.width * scale,
    height: roundToInt ? Math.round(dims.height * scale) : dims.height * scale,
  };
}

/**
 * Fit dimensions within constraints while preserving aspect ratio
 */
export function fitDimensions(
  source: Dimensions,
  target: Dimensions,
  mode: 'contain' | 'cover' = 'contain'
): Dimensions {
  const sourceRatio = source.width / source.height;
  const targetRatio = target.width / target.height;
  
  let scale: number;
  if (mode === 'contain') {
    scale = sourceRatio > targetRatio
      ? target.width / source.width
      : target.height / source.height;
  } else {
    scale = sourceRatio > targetRatio
      ? target.height / source.height
      : target.width / source.width;
  }
  
  return scaleDimensions(source, scale, true);
}
