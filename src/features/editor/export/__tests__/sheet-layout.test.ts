import { describe, expect, it } from 'vitest';
import {
  createPrintable4x6Layout,
  PRINT_4X6_HEIGHT_PX,
  PRINT_4X6_WIDTH_PX,
  PRINT_DPI,
} from '../sheet-layout';

describe('createPrintable4x6Layout', () => {
  it('returns correct canvas size for default 4x6', () => {
    const layout = createPrintable4x6Layout({ photoSize: { width: 600, height: 800 }, copies: 4 });
    expect(layout.canvas.width).toBe(PRINT_4X6_WIDTH_PX);
    expect(layout.canvas.height).toBe(PRINT_4X6_HEIGHT_PX);
  });

  it('uses custom canvas size when provided', () => {
    const layout = createPrintable4x6Layout({
      photoSize: { width: 100, height: 100 },
      copies: 1,
      canvasSize: { width: 800, height: 600 },
    });
    expect(layout.canvas.width).toBe(800);
    expect(layout.canvas.height).toBe(600);
  });

  it('calculates correct capacity for square photos', () => {
    const size = 300;
    const margin = 50;
    const gap = 10;
    const printableWidth = PRINT_4X6_WIDTH_PX - margin * 2;
    const printableHeight = PRINT_4X6_HEIGHT_PX - margin * 2;
    const expectedCols = Math.floor((printableWidth + gap) / (size + gap));
    const expectedRows = Math.floor((printableHeight + gap) / (size + gap));
    const expectedCapacity = expectedCols * expectedRows;
    const layout = createPrintable4x6Layout({ photoSize: { width: size, height: size }, copies: 100, marginPx: margin, gapPx: gap });
    expect(layout.columns).toBe(expectedCols);
    expect(layout.rows).toBe(expectedRows);
    expect(layout.renderedCopies).toBe(expectedCapacity);
    expect(layout.requestedCopies).toBe(100);
  });

  it('renders requested copies when they fit within capacity', () => {
    const layout = createPrintable4x6Layout({ photoSize: { width: 500, height: 700 }, copies: 2 });
    expect(layout.renderedCopies).toBe(2);
    expect(layout.placements.length).toBe(2);
  });

  it('centers placements horizontally and vertically', () => {
    const layout = createPrintable4x6Layout({ photoSize: { width: 500, height: 700 }, copies: 2 });
    const usedWidth = layout.columns * 500 + (layout.columns - 1) * 24;
    const usedHeight = Math.ceil(layout.renderedCopies / layout.columns) * 700;
    expect(layout.placements[0].x).toBe(layout.printableBounds.x + Math.floor((layout.printableBounds.width - usedWidth) / 2));
    expect(layout.placements[0].y).toBe(layout.printableBounds.y + Math.floor((layout.printableBounds.height - usedHeight) / 2));
  });

  it('returns placements with correct row and column indices', () => {
    const layout = createPrintable4x6Layout({ photoSize: { width: 400, height: 500 }, copies: 4 });
    for (let index = 0; index < layout.placements.length; index++) {
      const p = layout.placements[index];
      expect(p.row).toBe(Math.floor(index / layout.columns));
      expect(p.column).toBe(index % layout.columns);
    }
  });

  it('provides each placement with correct dimensions', () => {
    const photoSize = { width: 600, height: 800 };
    const layout = createPrintable4x6Layout({ photoSize, copies: 2 });
    for (const p of layout.placements) {
      expect(p.width).toBe(photoSize.width);
      expect(p.height).toBe(photoSize.height);
    }
  });

  it('returns zero placements when photo does not fit within printable bounds', () => {
    const layout = createPrintable4x6Layout({ photoSize: { width: PRINT_4X6_WIDTH_PX + 1, height: 100 }, copies: 1, marginPx: 0 });
    expect(layout.renderedCopies).toBe(0);
    expect(layout.placements).toHaveLength(0);
  });

  it('throws for negative margins', () => {
    expect(() => createPrintable4x6Layout({ photoSize: { width: 100, height: 100 }, copies: 1, marginPx: -10 })).toThrow('Sheet margin and gap must be non-negative.');
  });

  it('throws for negative gap', () => {
    expect(() => createPrintable4x6Layout({ photoSize: { width: 100, height: 100 }, copies: 1, gapPx: -5 })).toThrow('Sheet margin and gap must be non-negative.');
  });

  it('throws for non-integer canvas dimensions', () => {
    expect(() => createPrintable4x6Layout({ photoSize: { width: 100, height: 100 }, copies: 1, canvasSize: { width: 100.5, height: 100 } })).toThrow('canvasSize.width must be a positive integer.');
  });

  it('throws for zero photo dimensions', () => {
    expect(() => createPrintable4x6Layout({ photoSize: { width: 0, height: 100 }, copies: 1 })).toThrow('photoSize.width must be a positive integer.');
  });

  it('throws for negative copies', () => {
    expect(() => createPrintable4x6Layout({ photoSize: { width: 100, height: 100 }, copies: -1 })).toThrow('copies must be a positive integer.');
  });

  it('throws when margins exceed canvas size', () => {
    expect(() => createPrintable4x6Layout({ photoSize: { width: 100, height: 100 }, copies: 1, canvasSize: { width: 200, height: 200 }, marginPx: 150 })).toThrow('Printable bounds are too small for the selected margins.');
  });
});

describe('Sheet layout constants', () => {
  it('has expected 4x6 dimensions', () => {
    expect(PRINT_4X6_WIDTH_PX).toBe(1800);
    expect(PRINT_4X6_HEIGHT_PX).toBe(1200);
    expect(PRINT_DPI).toBe(300);
  });
});
