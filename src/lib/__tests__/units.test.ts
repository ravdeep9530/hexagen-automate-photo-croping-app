import { describe, it, expect } from 'vitest';
import {
  // Basic conversions
  mmToInches,
  inchesToMm,
  mmToPx,
  pxToMm,
  inchesToPx,
  pxToInches,
  
  // Dimension conversions
  dimensionsMmToInches,
  dimensionsInchesToMm,
  dimensionsMmToPx,
  dimensionsPxToMm,
  dimensionsInchesToPx,
  dimensionsPxToInches,
  
  // Calculations
  calculateDpiFromMm,
  calculateDpiFromInches,
  calculatePxFromPhysicalSize,
  calculatePhysicalSizeFromPx,
  calculateAspectRatio,
  megapixelsToDimensions,
  
  // Utilities
  roundPrecision,
  formatFileSize,
  formatDimensions,
  dimensionsMatch,
  scaleDimensions,
  fitDimensions,
  
  // Types
  RoundingMode,
  Dimensions,
} from '../units';

const DEFAULT_DPI = 300;
const MM_PER_INCH = 25.4;

describe('roundPrecision', () => {
  it('rounds to nearest by default', () => {
    expect(roundPrecision(1.234, 2)).toBe(1.23);
    expect(roundPrecision(1.235, 2)).toBe(1.24);
    expect(roundPrecision(1.236, 2)).toBe(1.24);
  });
  
  it('rounds with floor mode', () => {
    expect(roundPrecision(1.239, 2, 'floor')).toBe(1.23);
    expect(roundPrecision(-1.239, 2, 'floor')).toBe(-1.24);
  });
  
  it('rounds with ceil mode', () => {
    expect(roundPrecision(1.231, 2, 'ceil')).toBe(1.24);
    expect(roundPrecision(-1.231, 2, 'ceil')).toBe(-1.23);
  });
  
  it('rounds with trunc mode', () => {
    expect(roundPrecision(1.239, 2, 'trunc')).toBe(1.23);
    expect(roundPrecision(-1.239, 2, 'trunc')).toBe(-1.23);
  });
});

describe('mmToInches', () => {
  it('converts millimeters to inches correctly', () => {
    expect(mmToInches(25.4)).toBe(1);
    expect(mmToInches(50.8)).toBe(2);
    expect(mmToInches(35)).toBeCloseTo(1.378, 3);
  });
  
  it('rounds to specified decimal places', () => {
    expect(mmToInches(35, 2)).toBe(1.38);
    expect(mmToInches(45, 3)).toBe(1.772);
  });
  
  it('handles zero', () => {
    expect(mmToInches(0)).toBe(0);
  });
  
  it('handles negative values', () => {
    expect(mmToInches(-25.4)).toBe(-1);
  });
});

describe('inchesToMm', () => {
  it('converts inches to millimeters correctly', () => {
    expect(inchesToMm(1)).toBe(25.4);
    expect(inchesToMm(2)).toBe(50.8);
  });
  
  it('rounds to specified decimal places', () => {
    expect(inchesToMm(1.5, 1)).toBe(38.1);
    expect(inchesToMm(2, 2)).toBe(50.8);
  });
  
  it('handles zero', () => {
    expect(inchesToMm(0)).toBe(0);
  });
});

describe('mmToPx', () => {
  it('converts millimeters to pixels at 300 DPI', () => {
    // 1 inch = 25.4mm = 300px at 300 DPI
    expect(mmToPx(25.4, 300)).toBe(300);
    expect(mmToPx(50.8, 300)).toBe(600);
  });
  
  it('converts at different DPIs', () => {
    expect(mmToPx(25.4, 150)).toBe(150);
    expect(mmToPx(25.4, 600)).toBe(600);
  });
  
  it('uses default DPI of 300', () => {
    expect(mmToPx(25.4)).toBe(300);
  });
  
  it('rounds to decimal places', () => {
    expect(mmToPx(35, 300, 0)).toBe(413);
    expect(mmToPx(45, 300, 0)).toBe(531);
  });
});

describe('pxToMm', () => {
  it('converts pixels to millimeters at 300 DPI', () => {
    expect(pxToMm(300, 300)).toBe(25.4);
    expect(pxToMm(600, 300)).toBe(50.8);
  });
  
  it('uses default DPI of 300', () => {
    expect(pxToMm(300)).toBe(25.4);
  });
  
  it('rounds to decimal places', () => {
    expect(pxToMm(413, 300, 2)).toBe(34.97);
  });
});

describe('inchesToPx', () => {
  it('converts inches to pixels', () => {
    expect(inchesToPx(1, 300)).toBe(300);
    expect(inchesToPx(2, 300)).toBe(600);
    expect(inchesToPx(1, 150)).toBe(150);
  });
});

describe('pxToInches', () => {
  it('converts pixels to inches', () => {
    expect(pxToInches(300, 300)).toBe(1);
    expect(pxToInches(600, 300)).toBe(2);
  });
});

describe('dimension conversions', () => {
  const dimsMm: Dimensions = { width: 50, height: 70 };
  const dimsInches: Dimensions = { width: 2, height: 2.756 };
  const dimsPx: Dimensions = { width: 600, height: 827 };
  
  describe('dimensionsMmToInches', () => {
    it('converts dimension object from mm to inches', () => {
      const result = dimensionsMmToInches(dimsMm, 2);
      expect(result.width).toBeCloseTo(1.97, 2);
      expect(result.height).toBeCloseTo(2.76, 2);
    });
  });
  
  describe('dimensionsInchesToMm', () => {
    it('converts dimension object from inches to mm', () => {
      const result = dimensionsInchesToMm({ width: 2, height: 2 }, 1);
      expect(result.width).toBe(50.8);
      expect(result.height).toBe(50.8);
    });
  });
  
  describe('dimensionsMmToPx', () => {
    it('converts dimensions from mm to pixels', () => {
      const result = dimensionsMmToPx({ width: 25.4, height: 25.4 }, 300);
      expect(result.width).toBe(300);
      expect(result.height).toBe(300);
    });
  });
  
  describe('dimensionsPxToMm', () => {
    it('converts dimensions from pixels to mm', () => {
      const result = dimensionsPxToMm({ width: 300, height: 300 }, 300, 2);
      expect(result.width).toBe(25.4);
      expect(result.height).toBe(25.4);
    });
  });
  
  describe('dimensionsInchesToPx', () => {
    it('converts dimensions from inches to pixels', () => {
      const result = dimensionsInchesToPx({ width: 1, height: 1 }, 300);
      expect(result.width).toBe(300);
      expect(result.height).toBe(300);
    });
  });
  
  describe('dimensionsPxToInches', () => {
    it('converts dimensions from pixels to inches', () => {
      const result = dimensionsPxToInches({ width: 300, height: 300 }, 300, 2);
      expect(result.width).toBe(1);
      expect(result.height).toBe(1);
    });
  });
});

describe('calculateDpiFromMm', () => {
  it('calculates DPI from pixel and mm dimensions', () => {
    // 600px / (50.8mm / 25.4) = 600px / 2in = 300 DPI
    const result = calculateDpiFromMm(600, 600, 50.8, 50.8);
    expect(result.horizontalDpi).toBe(300);
    expect(result.verticalDpi).toBe(300);
  });
  
  it('handles different aspect ratios', () => {
    const result = calculateDpiFromMm(600, 800, 50.8, 67.73, 0);
    expect(result.horizontalDpi).toBe(300);
    expect(result.verticalDpi).toBe(300);
  });
});

describe('calculateDpiFromInches', () => {
  it('calculates DPI from pixel and inch dimensions', () => {
    const result = calculateDpiFromInches(600, 600, 2, 2);
    expect(result.horizontalDpi).toBe(300);
    expect(result.verticalDpi).toBe(300);
  });
});

describe('calculatePxFromPhysicalSize', () => {
  it('calculates pixel dimensions from mm at 300 DPI', () => {
    const result = calculatePxFromPhysicalSize(25.4, 25.4, 300, false);
    expect(result.width).toBe(300);
    expect(result.height).toBe(300);
    expect(result.totalPixels).toBe(90000);
    expect(result.megapixels).toBe(0.09);
  });
  
  it('rounds to integers by default', () => {
    const result = calculatePxFromPhysicalSize(35, 45, 300);
    expect(Number.isInteger(result.width)).toBe(true);
    expect(Number.isInteger(result.height)).toBe(true);
  });
  
  it('calculates standard passport size', () => {
    const result = calculatePxFromPhysicalSize(35, 45, 300);
    expect(result.width).toBe(413);
    expect(result.height).toBe(531);
  });
  
  it('calculates US passport size (2x2 inches)', () => {
    // 2 inches = 50.8mm
    const result = calculatePxFromPhysicalSize(50.8, 50.8, 300);
    expect(result.width).toBe(600);
    expect(result.height).toBe(600);
  });
});

describe('calculatePhysicalSizeFromPx', () => {
  it('calculates mm dimensions from pixels at 300 DPI', () => {
    const result = calculatePhysicalSizeFromPx(300, 300, 300, 2);
    expect(result.width).toBe(25.4);
    expect(result.height).toBe(25.4);
    expect(result.aspectRatio).toBe(1);
    expect(result.diagonalMm).toBeCloseTo(35.92, 1);
    expect(result.diagonalInches).toBeCloseTo(1.41, 2);
  });
  
  it('handles rectangular dimensions', () => {
    const result = calculatePhysicalSizeFromPx(600, 400, 300, 2);
    expect(result.aspectRatio).toBe(1.5);
  });
});

describe('calculateAspectRatio', () => {
  it('calculates aspect ratio', () => {
    expect(calculateAspectRatio(4, 3)).toBe(1.3333);
    expect(calculateAspectRatio(16, 9, 4)).toBe(1.7778);
    expect(calculateAspectRatio(1, 1)).toBe(1);
  });
});

describe('megapixelsToDimensions', () => {
  it('calculates dimensions from megapixels', () => {
    const result = megapixelsToDimensions(1);
    expect(result.totalPixels).toBe(1_000_000);
    expect(result.width).toBe(1000);
    expect(result.height).toBe(1000);
  });
  
  it('calculates with different aspect ratios', () => {
    const result = megapixelsToDimensions(1, 16 / 9);
    // ~1333 x 750 for 16:9 aspect ratio
    expect(result.totalPixels).toBe(1_000_000);
    expect(result.aspectRatio).toBeGreaterThan(1.7);
  });
});

describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(512)).toBe('512 B');
  });
  
  it('formats kilobytes', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(1024)).toBe('1 KB');
  });
  
  it('formats megabytes', () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5 MB');
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
  });
  
  it('formats gigabytes', () => {
    expect(formatFileSize(2 * 1024 * 1024 * 1024)).toBe('2 GB');
  });
});

describe('formatDimensions', () => {
  it('formats pixel dimensions', () => {
    expect(formatDimensions({ width: 600, height: 800 }, 'px')).toBe('600px × 800px');
  });
  
  it('formats mm dimensions', () => {
    expect(formatDimensions({ width: 35, height: 45 }, 'mm')).toBe('35mm × 45mm');
  });
  
  it('formats inch dimensions', () => {
    expect(formatDimensions({ width: 2, height: 2 }, 'in')).toBe('2in × 2in');
  });
});

describe('dimensionsMatch', () => {
  it('returns true for matching dimensions', () => {
    expect(dimensionsMatch({ width: 100, height: 100 }, { width: 100, height: 100 })).toBe(true);
  });
  
  it('returns false for different dimensions', () => {
    expect(dimensionsMatch({ width: 100, height: 100 }, { width: 200, height: 100 })).toBe(false);
  });
  
  it('allows tolerance', () => {
    expect(dimensionsMatch({ width: 100, height: 100 }, { width: 101, height: 100 }, 0.02)).toBe(true);
  });
  
  it('respects tolerance limit', () => {
    expect(dimensionsMatch({ width: 100, height: 100 }, { width: 110, height: 100 }, 0.05)).toBe(false);
  });
});

describe('scaleDimensions', () => {
  it('scales dimensions by factor', () => {
    const result = scaleDimensions({ width: 100, height: 200 }, 2);
    expect(result.width).toBe(200);
    expect(result.height).toBe(400);
  });
  
  it('rounds to integers when specified', () => {
    const result = scaleDimensions({ width: 100, height: 100 }, 1.5, true);
    expect(result.width).toBe(150);
    expect(result.height).toBe(150);
    expect(Number.isInteger(result.width)).toBe(true);
  });
  
  it('preserves floats when not rounding', () => {
    const result = scaleDimensions({ width: 100, height: 100 }, 1.5, false);
    expect(result.width).toBe(150);
    expect(result.height).toBe(150);
  });
});

describe('fitDimensions', () => {
  it('scales down to contain within target', () => {
    const source = { width: 1000, height: 1000 };
    const target = { width: 500, height: 400 };
    const result = fitDimensions(source, target, 'contain');
    
    // Should fit within 500x400, maintaining aspect ratio
    expect(result.width).toBe(400);
    expect(result.height).toBe(400);
  });
  
  it('handles cover mode', () => {
    const source = { width: 1000, height: 1000 };
    const target = { width: 500, height: 400 };
    const result = fitDimensions(source, target, 'cover');
    
    // Should cover 500x400, maintaining aspect ratio
    expect(result.width).toBe(500);
    expect(result.height).toBe(500);
  });
  
  it('handles same aspect ratio', () => {
    const source = { width: 800, height: 600 };
    const target = { width: 400, height: 300 };
    const result = fitDimensions(source, target, 'contain');
    
    expect(result.width).toBe(400);
    expect(result.height).toBe(300);
  });
});

// Deterministic rounding behavior tests
describe('deterministic rounding', () => {
  it('produces consistent results for mm to inches conversions', () => {
    // These values should be deterministic
    const results: number[] = [];
    for (let i = 0; i < 10; i++) {
      results.push(mmToInches(35, 3));
    }
    const allEqual = results.every(r => r === results[0]);
    expect(allEqual).toBe(true);
    expect(results[0]).toBe(1.378);
  });
  
  it('produces consistent pixel calculations', () => {
    const results: number[] = [];
    for (let i = 0; i < 10; i++) {
      const dims = calculatePxFromPhysicalSize(35, 45, 300);
      results.push(dims.width);
    }
    const allEqual = results.every(r => r === results[0]);
    expect(allEqual).toBe(true);
    expect(results[0]).toBe(413);
  });
  
  it('handles edge cases deterministically', () => {
    expect(mmToPx(0)).toBe(0);
    expect(pxToMm(0)).toBe(0);
    expect(calculateAspectRatio(0, 100)).toBe(0);
  });
});
