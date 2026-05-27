import { z } from 'zod';

/**
 * Upload status for tracking file processing
 */
export const UploadStatusSchema = z.enum([
  'pending',
  'uploading',
  'validating',
  'valid',
  'invalid',
  'processing',
  'error',
]);
export type UploadStatus = z.infer<typeof UploadStatusSchema>;

/**
 * Image color mode
 */
export const ColorModeSchema = z.enum(['rgb', 'rgba', 'grayscale', 'cmyk', 'unknown']);
export type ColorMode = z.infer<typeof ColorModeSchema>;

/**
 * Image metadata extracted from file
 */
export const ImageMetadataSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  aspectRatio: z.number().positive(),
  format: z.enum(['jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'unknown']),
  colorMode: ColorModeSchema,
  hasAlpha: z.boolean(),
  bitDepth: z.number().int().positive().optional(),
  dpi: z.number().positive().optional(),
  fileSizeBytes: z.number().int().nonnegative(),
  exif: z.record(z.unknown()).optional(),
});

export type ImageMetadata = z.infer<typeof ImageMetadataSchema>;

/**
 * Upload asset - represents a user uploaded image
 */
export const ImageAssetSchema = z.object({
  id: z.string(),
  name: z.string(),
  // Note: File object is not serializable and excluded from persistence
  file: z.instanceof(File).optional(),
  blobUrl: z.string().optional(),
  metadata: ImageMetadataSchema,
  status: UploadStatusSchema.default('pending'),
  uploadedAt: z.string().datetime(),
  errorMessage: z.string().optional(),
  // SHA-256 hash for integrity
  hash: z.string().optional(),
});

export type ImageAsset = z.infer<typeof ImageAssetSchema>;

/**
 * Face detection bounding box
 */
export const FaceBoundingBoxSchema = z.object({
  x: z.number().nonnegative(),
  y: z.number().nonnegative(),
  width: z.number().positive(),
  height: z.number().positive(),
  confidence: z.number().min(0).max(1),
});

export type FaceBoundingBox = z.infer<typeof FaceBoundingBoxSchema>;

/**
 * Facial landmarks
 */
export const FacialLandmarksSchema = z.object({
  leftEye: z.object({ x: z.number(), y: z.number() }),
  rightEye: z.object({ x: z.number(), y: z.number() }),
  nose: z.object({ x: z.number(), y: z.number() }),
  leftMouth: z.object({ x: z.number(), y: z.number() }),
  rightMouth: z.object({ x: z.number(), y: z.number() }),
});

export type FacialLandmarks = z.infer<typeof FacialLandmarksSchema>;

/**
 * Detected face result
 */
export const FaceDetectionResultSchema = z.object({
  id: z.string(),
  boundingBox: FaceBoundingBoxSchema,
  landmarks: FacialLandmarksSchema.optional(),
  // Position metrics in pixels and percentages
  eyeDistancePx: z.number().positive(),
  chinToTopOfHeadPx: z.number().positive(),
  eyeHeightPosition: z.number().min(0).max(1),
  // Quality metrics
  sharpnessScore: z.number().min(0).max(1).optional(),
  exposureScore: z.number().min(0).max(1).optional(),
});

export type FaceDetectionResult = z.infer<typeof FaceDetectionResultSchema>;

/**
 * Complete face detection analysis
 */
export const FaceAnalysisSchema = z.object({
  faces: z.array(FaceDetectionResultSchema),
  detectedAt: z.string().datetime(),
  durationMs: z.number().nonnegative(),
  imageDimensions: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
  primaryFaceIndex: z.number().int().nonnegative().optional(),
});

export type FaceAnalysis = z.infer<typeof FaceAnalysisSchema>;

/**
 * Crop state for editor
 */
export const CropStateSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  // Rotation in degrees
  rotation: z.number().default(0),
  // Scale factor (zoom)
  scale: z.number().positive().default(1),
  // Flip states
  flipHorizontal: z.boolean().default(false),
  flipVertical: z.boolean().default(false),
  // Constraints applied
  aspectRatio: z.number().positive().optional(),
  minWidth: z.number().positive().optional(),
  minHeight: z.number().positive().optional(),
});

export type CropState = z.infer<typeof CropStateSchema>;

/**
 * Processing settings for image manipulation
 */
export const ProcessingSettingsSchema = z.object({
  // Brightness adjustment (-1 to 1)
  brightness: z.number().min(-1).max(1).default(0),
  // Contrast adjustment (-1 to 1)
  contrast: z.number().min(-1).max(1).default(0),
  // Saturation adjustment (-1 to 1)
  saturation: z.number().min(-1).max(1).default(0),
  // Sharpness adjustment (0 to 1)
  sharpness: z.number().min(0).max(1).default(0),
  // Background removal/replacement
  background: z.object({
    mode: z.enum(['original', 'remove', 'replace', 'blur']),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    blurAmount: z.number().min(0).max(1).optional(),
  }).default({ mode: 'original' }),
  // Skin smoothing (0 to 1)
  skinSmoothing: z.number().min(0).max(1).default(0),
  // Red-eye reduction
  redEyeReduction: z.boolean().default(false),
  // Auto-enhance
  autoEnhance: z.boolean().default(false),
  // Grayscale conversion
  grayscale: z.boolean().default(false),
});

export type ProcessingSettings = z.infer<typeof ProcessingSettingsSchema>;

/**
 * Canvas rendering options
 */
export const CanvasRenderingOptionsSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  dpi: z.number().positive().default(300),
  format: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  quality: z.number().min(0).max(1).default(0.92),
  colorSpace: z.enum(['srgb', 'display-p3', 'rec2020']).default('srgb'),
});

export type CanvasRenderingOptions = z.infer<typeof CanvasRenderingOptionsSchema>;

/**
 * Get primary face from analysis
 */
export function getPrimaryFace(analysis: FaceAnalysis): FaceDetectionResult | undefined {
  if (analysis.faces.length === 0) {
    return undefined;
  }
  if (analysis.primaryFaceIndex !== undefined) {
    return analysis.faces[analysis.primaryFaceIndex];
  }
  // Return the face with highest confidence
  return analysis.faces.reduce((prev, current) => 
    current.boundingBox.confidence > prev.boundingBox.confidence ? current : prev
  );
}

/**
 * Calculate face distance metrics in millimeters
 */
export function calculateFaceMetricsMm(
  face: FaceDetectionResult,
  imageDpi: number
): { eyeDistanceMm: number; chinToTopMm: number } {
  const pxToMm = (px: number) => (px / imageDpi) * 25.4;
  return {
    eyeDistanceMm: pxToMm(face.eyeDistancePx),
    chinToTopMm: pxToMm(face.chinToTopOfHeadPx),
  };
}

/**
 * Validate crop state against constraints
 */
export function validateCropState(crop: CropState): { valid: boolean; error?: string } {
  if (crop.width <= 0 || crop.height <= 0) {
    return { valid: false, error: 'Crop dimensions must be positive' };
  }
  if (crop.aspectRatio !== undefined) {
    const actualRatio = crop.width / crop.height;
    const tolerance = 0.01;
    if (Math.abs(actualRatio - crop.aspectRatio) > tolerance) {
      return { valid: false, error: 'Crop does not match required aspect ratio' };
    }
  }
  if (crop.minWidth !== undefined && crop.width < crop.minWidth) {
    return { valid: false, error: `Crop width must be at least ${crop.minWidth}` };
  }
  if (crop.minHeight !== undefined && crop.height < crop.minHeight) {
    return { valid: false, error: `Crop height must be at least ${crop.minHeight}` };
  }
  return { valid: true };
}
