import type { ComplianceRule, ValidationIssue } from '@/domain/compliance';

export interface AssetMetadata {
  widthPx: number;
  heightPx: number;
  fileSizeBytes: number;
  mimeType: string;
  filename?: string;
}

export interface CropState {
  widthPx: number;
  heightPx: number;
  x: number;
  y: number;
  rotation?: number;
}

export interface ProcessingSettings {
  backgroundColor?: string;
  targetDpi?: number;
  applyWebSafeResize?: boolean;
}

export interface ExportSettings {
  format: 'jpeg' | 'png';
  quality?: number;
  maxFileSizeBytes?: number;
  targetWidthPx?: number;
  targetHeightPx?: number;
  targetDpi?: number;
}

export interface FaceDetectionResult {
  faceCount: number;
  faces: Array<{
    boundingBox: { x: number; y: number; width: number; height: number };
    landmarks?: Record<string, { x: number; y: number }>;
  }>;
}

export interface ValidationContext {
  asset?: AssetMetadata;
  crop?: CropState;
  processing?: ProcessingSettings;
  exportSettings?: ExportSettings;
  faceDetection?: FaceDetectionResult | null;
}

export type RuleEvaluator<T extends ValidationContext = ValidationContext> = (
  rule: ComplianceRule,
  context: T,
  checkedAt: string
) => ValidationIssue | null;

export const FILE_SIZE_MAX_BYTES = 10 * 1024 * 1024;

export function createIssue(
  rule: ComplianceRule,
  checkedAt: string,
  message?: string,
  details?: Record<string, unknown>
): ValidationIssue {
  return {
    ruleId: rule.id,
    type: rule.type,
    severity: rule.severity,
    message: message || rule.errorMessage,
    details,
    suggestion: rule.helpText,
    checkedAt,
  };
}

export function evaluateAutomaticRule(
  rule: ComplianceRule,
  context: ValidationContext,
  checkedAt: string
): ValidationIssue | null {
  const err = validateByType(rule, context);
  if (err) {
    return createIssue(rule, checkedAt, err.message, err.details);
  }
  return null;
}

export function validateByType(
  rule: ComplianceRule,
  context: ValidationContext
): { message: string; details?: Record<string, unknown> } | null {
  const params = rule.parameters ?? {};

  switch (rule.type) {
    case 'dimension': {
      if (!context.crop) return { message: rule.errorMessage || 'Crop dimensions not available' };
      const minWidth = typeof params.minWidth === 'number' ? params.minWidth : undefined;
      const minHeight = typeof params.minHeight === 'number' ? params.minHeight : undefined;
      const exactWidth = typeof params.exactWidth === 'number' ? params.exactWidth : undefined;
      const exactHeight = typeof params.exactHeight === 'number' ? params.exactHeight : undefined;
      if (exactWidth !== undefined && context.crop.widthPx !== exactWidth) return { message: `Width must be exactly ${exactWidth}px, got ${context.crop.widthPx}px`, details: { expected: exactWidth, actual: context.crop.widthPx } };
      if (exactHeight !== undefined && context.crop.heightPx !== exactHeight) return { message: `Height must be exactly ${exactHeight}px, got ${context.crop.heightPx}px`, details: { expected: exactHeight, actual: context.crop.heightPx } };
      if (minWidth !== undefined && context.crop.widthPx < minWidth) return { message: `Width must be at least ${minWidth}px`, details: { minWidth, actual: context.crop.widthPx } };
      if (minHeight !== undefined && context.crop.heightPx < minHeight) return { message: `Height must be at least ${minHeight}px`, details: { minHeight, actual: context.crop.heightPx } };
      return null;
    }

    case 'aspect-ratio': {
      if (!context.crop) return { message: rule.errorMessage || 'Crop dimensions not available' };
      const ratio = params.ratio ?? params.aspectRatio ?? params.targetRatio;
      const tolerance = typeof params.tolerance === 'number'
        ? params.tolerance
        : typeof params.tolerancePercent === 'number'
          ? params.tolerancePercent / 100
          : 0.01;
      let expected: number | undefined;
      let label = String(ratio);
      if (typeof ratio === 'string') {
        const [w, h] = ratio.split(':').map(Number);
        if (w && h) expected = w / h;
      } else if (typeof ratio === 'number') {
        expected = ratio;
        label = ratio.toFixed(4);
      }
      if (expected === undefined) return null;
      const actual = context.crop.widthPx / context.crop.heightPx;
      if (Math.abs(actual - expected) > tolerance) return { message: `Aspect ratio must be ${label} (±${Math.round(tolerance * 100)}%)`, details: { expectedRatio: label, actualRatio: actual } };
      return null;
    }

    case 'file-size': {
      if (!context.asset) return { message: rule.errorMessage || 'Asset not available' };
      const maxBytes = typeof params.maxBytes === 'number'
        ? params.maxBytes
        : typeof params.maxSizeMb === 'number'
          ? params.maxSizeMb * 1024 * 1024
          : FILE_SIZE_MAX_BYTES;
      const minBytes = typeof params.minBytes === 'number' ? params.minBytes : undefined;
      if (context.asset.fileSizeBytes > maxBytes) return { message: `File size exceeds ${bytesToKB(maxBytes)} KB`, details: { maxBytes, actual: context.asset.fileSizeBytes } };
      if (minBytes !== undefined && context.asset.fileSizeBytes < minBytes) return { message: `File size below minimum ${bytesToKB(minBytes)} KB`, details: { minBytes, actual: context.asset.fileSizeBytes } };
      return null;
    }

    case 'format': {
      if (!context.asset) return { message: rule.errorMessage || 'Asset not available' };
      const allowed = Array.isArray(params.formats)
        ? params.formats
        : Array.isArray(params.acceptedFormats)
          ? params.acceptedFormats
          : ['image/jpeg', 'image/png'];
      if (!allowed.includes(context.asset.mimeType)) return { message: `Unsupported format: ${context.asset.mimeType}`, details: { allowed, actual: context.asset.mimeType } };
      return null;
    }

    case 'resolution': {
      const minDpiRaw = params.minDPI ?? params.minDpi ?? 300;
      const minDpi = typeof minDpiRaw === 'number' ? minDpiRaw : 300;
      const minWidthPxRaw = params.minWidthPx;
      const minHeightPxRaw = params.minHeightPx;

      const exportProcessingDpi = context.processing?.targetDpi ?? context.exportSettings?.targetDpi ?? 300;
      if (exportProcessingDpi < minDpi) return { message: `Resolution ${exportProcessingDpi} DPI is below minimum ${minDpi} DPI`, details: { requiredDPI: minDpi, actualDPI: exportProcessingDpi } };

      if (context.asset) {
        const minWidthPx = typeof minWidthPxRaw === 'number' ? minWidthPxRaw : undefined;
        const minHeightPx = typeof minHeightPxRaw === 'number' ? minHeightPxRaw : undefined;
        if (minWidthPx && context.asset.widthPx < minWidthPx) return { message: `Image width must be at least ${minWidthPx}px`, details: { minWidthPx, actual: context.asset.widthPx } };
        if (minHeightPx && context.asset.heightPx < minHeightPx) return { message: `Image height must be at least ${minHeightPx}px`, details: { minHeightPx, actual: context.asset.heightPx } };
      }
      return null;
    }

    case 'face-count': {
      const faceCount = context.faceDetection?.faceCount ?? 0;
      const required = typeof params.required === 'number' ? params.required : 1;
      if (faceCount !== required) return { message: `Expected ${required} face(s), detected ${faceCount}`, details: { required, actual: faceCount } };
      return null;
    }

    case 'background': {
      const allowedColors = Array.isArray(params.allowedColors) ? params.allowedColors : undefined;
      const desired = typeof params.preferredHex === 'string' ? params.preferredHex.toLowerCase() : undefined;
      const actual = context.processing?.backgroundColor?.toLowerCase();
      if (desired && actual && actual !== desired) return { message: rule.errorMessage, details: { expected: desired, actual } };
      if (allowedColors && !actual) return null;
      return null;
    }

    case 'color-profile':
    case 'custom':
    case 'face-position':
    case 'expression':
    case 'glasses':
    case 'head-covering':
    case 'lighting':
      return null;
  }
  return null;
}

function bytesToKB(bytes: number): number {
  return Math.round(bytes / 1024);
}
