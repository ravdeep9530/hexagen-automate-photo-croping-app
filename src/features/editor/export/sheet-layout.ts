export const PRINT_4X6_WIDTH_PX = 1800;
export const PRINT_4X6_HEIGHT_PX = 1200;
export const PRINT_DPI = 300;

export interface Size {
  width: number;
  height: number;
}

export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface SheetLayoutOptions {
  photoSize: Size;
  copies: number;
  canvasSize?: Size;
  marginPx?: number;
  gapPx?: number;
}

export interface SheetPlacement {
  x: number;
  y: number;
  width: number;
  height: number;
  row: number;
  column: number;
}

export interface SheetLayout {
  canvas: Size;
  printableBounds: { x: number; y: number; width: number; height: number };
  placements: SheetPlacement[];
  requestedCopies: number;
  renderedCopies: number;
  columns: number;
  rows: number;
}

const DEFAULT_MARGIN_PX = 60;
const DEFAULT_GAP_PX = 24;

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
}

function assertPositiveSize(size: Size, name: string): void {
  assertPositiveInteger(size.width, `${name}.width`);
  assertPositiveInteger(size.height, `${name}.height`);
}

export function createPrintable4x6Layout(options: SheetLayoutOptions): SheetLayout {
  const canvas = options.canvasSize ?? { width: PRINT_4X6_WIDTH_PX, height: PRINT_4X6_HEIGHT_PX };
  const marginPx = options.marginPx ?? DEFAULT_MARGIN_PX;
  const gapPx = options.gapPx ?? DEFAULT_GAP_PX;

  assertPositiveSize(canvas, 'canvasSize');
  assertPositiveSize(options.photoSize, 'photoSize');
  assertPositiveInteger(options.copies, 'copies');

  if (marginPx < 0 || gapPx < 0) {
    throw new Error('Sheet margin and gap must be non-negative.');
  }

  const printableBounds = {
    x: marginPx,
    y: marginPx,
    width: canvas.width - marginPx * 2,
    height: canvas.height - marginPx * 2,
  };

  if (printableBounds.width <= 0 || printableBounds.height <= 0) {
    throw new Error('Printable bounds are too small for the selected margins.');
  }

  const columns = Math.max(
    0,
    Math.floor((printableBounds.width + gapPx) / (options.photoSize.width + gapPx)),
  );
  const rows = Math.max(
    0,
    Math.floor((printableBounds.height + gapPx) / (options.photoSize.height + gapPx)),
  );
  const capacity = columns * rows;
  const renderedCopies = Math.min(options.copies, capacity);
  const placements: SheetPlacement[] = [];

  if (renderedCopies === 0) {
    return {
      canvas,
      printableBounds,
      placements,
      requestedCopies: options.copies,
      renderedCopies,
      columns,
      rows,
    };
  }

  const usedRows = Math.ceil(renderedCopies / columns);
  const usedWidth = columns * options.photoSize.width + (columns - 1) * gapPx;
  const usedHeight = usedRows * options.photoSize.height + (usedRows - 1) * gapPx;
  const startX = printableBounds.x + Math.max(0, Math.floor((printableBounds.width - usedWidth) / 2));
  const startY = printableBounds.y + Math.max(0, Math.floor((printableBounds.height - usedHeight) / 2));

  for (let index = 0; index < renderedCopies; index += 1) {
    const row = Math.floor(index / columns);
    const column = index % columns;
    placements.push({
      x: startX + column * (options.photoSize.width + gapPx),
      y: startY + row * (options.photoSize.height + gapPx),
      width: options.photoSize.width,
      height: options.photoSize.height,
      row,
      column,
    });
  }

  return {
    canvas,
    printableBounds,
    placements,
    requestedCopies: options.copies,
    renderedCopies,
    columns,
    rows,
  };
}
