import { z } from 'zod';

/**
 * Export file format
 */
export const ExportFormatSchema = z.enum(['jpeg', 'png', 'webp', 'tiff']);
export type ExportFormat = z.infer<typeof ExportFormatSchema>;

/**
 * Export color mode
 */
export const ExportColorModeSchema = z.enum(['rgb', 'cmyk', 'grayscale']);
export type ExportColorMode = z.infer<typeof ExportColorModeSchema>;

/**
 * Print layout options
 */
export const PrintLayoutSchema = z.enum([
  'single',       // One photo per sheet
  'wallet',       // Wallet size prints
  '4x6-2up',      // 2 photos on 4x6
  '4x6-4up',      // 4 photos on 4x6
  '5x7-2up',      // 2 photos on 5x7
  '8x10-1up',     // 1 photo on 8x10
  'a4-4up',       // 4 photos on A4
  'a4-6up',       // 6 photos on A4
  'custom',       // Custom layout
]);
export type PrintLayout = z.infer<typeof PrintLayoutSchema>;

/**
 * Export destination
 */
export const ExportDestinationSchema = z.enum([
  'download',
  'print',
  'share',
  'clipboard',
]);
export type ExportDestination = z.infer<typeof ExportDestinationSchema>;

/**
 * Export settings for image generation
 */
export const ExportSettingsSchema = z.object({
  // Format and quality
  format: ExportFormatSchema.default('jpeg'),
  quality: z.number().min(0).max(1).default(0.95),
  colorMode: ExportColorModeSchema.default('rgb'),
  
  // Dimensions and resolution
  widthPx: z.number().int().positive(),
  heightPx: z.number().int().positive(),
  dpi: z.number().positive().default(300),
  
  // Print options
  printLayout: PrintLayoutSchema.default('single'),
  printSizes: z.array(z.object({
    widthMm: z.number().positive(),
    heightMm: z.number().positive(),
    copies: z.number().int().positive(),
  })).default([]),
  
  // Color profile
  colorProfile: z.enum(['sRGB', 'Adobe RGB', 'ProPhoto RGB', 'CMYK']).default('sRGB'),
  
  // Background for print
  printBackgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#FFFFFF'),
  
  // File naming
  filename: z.string().default('photo'),
  filenameSuffix: z.enum(['date', 'preset', 'none']).default('preset'),
  
  // Destination
  destination: ExportDestinationSchema.default('download'),
  
  // Additional options
  includeMetadata: z.boolean().default(false),
  stripExif: z.boolean().default(true),
  optimizeForWeb: z.boolean().default(false),
});

export type ExportSettings = z.infer<typeof ExportSettingsSchema>;

/**
 * Export job status
 */
export const ExportJobStatusSchema = z.enum([
  'pending',
  'preparing',
  'rendering',
  'encoding',
  'completed',
  'failed',
  'cancelled',
]);
export type ExportJobStatus = z.infer<typeof ExportJobStatusSchema>;

/**
 * Export job tracking
 */
export const ExportJobSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  settings: ExportSettingsSchema,
  status: ExportJobStatusSchema.default('pending'),
  progress: z.number().min(0).max(1).default(0),
  createdAt: z.string().datetime(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  errorMessage: z.string().optional(),
  resultBlob: z.instanceof(Blob).optional(),
  resultUrl: z.string().optional(),
  fileSizeBytes: z.number().int().nonnegative().optional(),
  // AbortController for cancellation (non-serializable)
  abortController: z.instanceof(AbortController).optional(),
});

export type ExportJob = z.infer<typeof ExportJobSchema>;

/**
 * File type to MIME type mapping
 */
export function getMimeType(format: ExportFormat): string {
  const mimeTypes: Record<ExportFormat, string> = {
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    tiff: 'image/tiff',
  };
  return mimeTypes[format];
}

/**
 * Get file extension for format
 */
export function getFileExtension(format: ExportFormat): string {
  const extensions: Record<ExportFormat, string> = {
    jpeg: 'jpg',
    png: 'png',
    webp: 'webp',
    tiff: 'tiff',
  };
  return extensions[format];
}

/**
 * Generate filename based on settings
 */
export function generateFilename(settings: ExportSettings, suffix?: string): string {
  let name = settings.filename || 'photo';
  
  if (settings.filenameSuffix === 'date') {
    const date = new Date().toISOString().split('T')[0];
    name = `${name}_${date}`;
  } else if (settings.filenameSuffix === 'preset' && suffix) {
    name = `${name}_${suffix}`;
  }
  
  const extension = getFileExtension(settings.format);
  return `${name}.${extension}`;
}

/**
 * Calculate file size estimate in bytes
 */
export function estimateFileSize(settings: ExportSettings): number {
  // Rough estimate: width * height * channels * compression factor
  const bytesPerPixel = settings.colorMode === 'grayscale' ? 1 : 3;
  const uncompressedSize = settings.widthPx * settings.heightPx * bytesPerPixel;
  
  // Compression factors by format and quality
  const compressionFactors: Record<ExportFormat, number> = {
    jpeg: 0.1 + (1 - settings.quality) * 0.3,
    png: 0.3, // PNG is lossless, so estimate varies by content
    webp: 0.08 + (1 - settings.quality) * 0.2,
    tiff: settings.quality < 1 ? 0.5 : 1.0, // TIFF can be compressed
  };
  
  return Math.round(uncompressedSize * compressionFactors[settings.format]);
}

/**
 * Standard print sizes in mm
 */
export const STANDARD_PRINT_SIZES = {
  '10x15': { widthMm: 102, heightMm: 152, name: '4x6"' },
  '13x18': { widthMm: 127, heightMm: 178, name: '5x7"' },
  '15x20': { widthMm: 152, heightMm: 203, name: '6x8"' },
  '20x25': { widthMm: 203, heightMm: 254, name: '8x10"' },
  'a4': { widthMm: 210, heightMm: 297, name: 'A4' },
  'a5': { widthMm: 148, heightMm: 210, name: 'A5' },
  'wallet': { widthMm: 64, heightMm: 89, name: 'Wallet' },
} as const;

/**
 * Get layout configuration for print size
 */
export function getPrintLayoutConfig(layout: PrintLayout): {
  sheetWidthMm: number;
  sheetHeightMm: number;
  photosPerSheet: number;
  photoWidthMm: number;
  photoHeightMm: number;
} {
  const configs: Record<PrintLayout, ReturnType<typeof getPrintLayoutConfig>> = {
    single: { sheetWidthMm: 0, sheetHeightMm: 0, photosPerSheet: 1, photoWidthMm: 0, photoHeightMm: 0 },
    wallet: { sheetWidthMm: 89, sheetHeightMm: 127, photosPerSheet: 1, photoWidthMm: 64, photoHeightMm: 89 },
    '4x6-2up': { sheetWidthMm: 102, sheetHeightMm: 152, photosPerSheet: 2, photoWidthMm: 51, photoHeightMm: 76 },
    '4x6-4up': { sheetWidthMm: 102, sheetHeightMm: 152, photosPerSheet: 4, photoWidthMm: 51, photoHeightMm: 38 },
    '5x7-2up': { sheetWidthMm: 127, sheetHeightMm: 178, photosPerSheet: 2, photoWidthMm: 63.5, photoHeightMm: 89 },
    '8x10-1up': { sheetWidthMm: 203, sheetHeightMm: 254, photosPerSheet: 1, photoWidthMm: 203, photoHeightMm: 254 },
    'a4-4up': { sheetWidthMm: 210, sheetHeightMm: 297, photosPerSheet: 4, photoWidthMm: 105, photoHeightMm: 148.5 },
    'a4-6up': { sheetWidthMm: 210, sheetHeightMm: 297, photosPerSheet: 6, photoWidthMm: 70, photoHeightMm: 99 },
    custom: { sheetWidthMm: 0, sheetHeightMm: 0, photosPerSheet: 1, photoWidthMm: 0, photoHeightMm: 0 },
  };
  
  return configs[layout];
}

/**
 * Validate export settings
 */
export function validateExportSettings(settings: ExportSettings): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (settings.widthPx < 1 || settings.heightPx < 1) {
    errors.push('Export dimensions must be positive');
  }
  
  if (settings.dpi < 72) {
    errors.push('DPI should be at least 72 for acceptable quality');
  }
  
  if (settings.quality < 0.7 && settings.format === 'jpeg') {
    errors.push('JPEG quality below 70% may result in visible artifacts');
  }
  
  if (settings.filename.length > 200) {
    errors.push('Filename too long');
  }
  
  // Check for invalid characters in filename
  if (/[<>:"/\\|?*]/.test(settings.filename)) {
    errors.push('Filename contains invalid characters');
  }
  
  return { valid: errors.length === 0, errors };
}
