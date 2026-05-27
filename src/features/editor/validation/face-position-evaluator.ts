import type { ComplianceRule, ValidationIssue } from '@/domain/compliance';
import type { FaceDetectionResult, ValidationContext } from './rule-evaluators';
import { createIssue } from './rule-evaluators';

export interface FacePositionParameters {
  centerXMin?: number;
  centerXMax?: number;
  centerYMin?: number;
  centerYMax?: number;
  faceWidthMinRatio?: number;
  faceWidthMaxRatio?: number;
  headHeightMinRatio?: number;
  headHeightMaxRatio?: number;
}

export function evaluateFacePositionRule(
  rule: ComplianceRule,
  context: ValidationContext,
  checkedAt: string
): ValidationIssue | null {
  const faceDetection = context.faceDetection;
  const crop = context.crop;

  if (!faceDetection || faceDetection.faceCount === 0) {
    return createIssue(rule, checkedAt, 'No face detected in the image', { reason: 'face-missing' });
  }

  if (!crop) {
    return createIssue(rule, checkedAt, 'Crop dimensions not available', { reason: 'crop-missing' });
  }

  const face = faceDetection.faces[0];
  if (!face) {
    return createIssue(rule, checkedAt, 'Primary face data unavailable', { reason: 'face-index-missing' });
  }

  const params: FacePositionParameters = rule.parameters ?? {};
  const violations: string[] = [];
  const details: Record<string, unknown> = {
    crop: { widthPx: crop.widthPx, heightPx: crop.heightPx },
    face: { bbox: face.boundingBox },
  };

  const faceCenterX = face.boundingBox.x + face.boundingBox.width / 2;
  const faceCenterY = face.boundingBox.y + face.boundingBox.height / 2;

  const centerXRatio = faceCenterX / crop.widthPx;
  const centerYRatio = faceCenterY / crop.heightPx;
  const faceWidthRatio = face.boundingBox.width / crop.widthPx;
  const faceHeightRatio = face.boundingBox.height / crop.heightPx;

  details.centerXRatio = centerXRatio;
  details.centerYRatio = centerYRatio;
  details.faceWidthRatio = faceWidthRatio;
  details.faceHeightRatio = faceHeightRatio;

  const centerXMin = params.centerXMin ?? 0.35;
  const centerXMax = params.centerXMax ?? 0.65;
  const centerYMin = params.centerYMin ?? 0.25;
  const centerYMax = params.centerYMax ?? 0.65;
  const minWidthRatio = params.faceWidthMinRatio ?? 0.25;
  const maxWidthRatio = params.faceWidthMaxRatio ?? 0.65;
  const minHeightRatio = params.headHeightMinRatio ?? 0.35;
  const maxHeightRatio = params.headHeightMaxRatio ?? 0.80;

  if (centerXRatio < centerXMin || centerXRatio > centerXMax) {
    violations.push(`Face center X (${(centerXRatio * 100).toFixed(1)}%) should be within ${(centerXMin * 100).toFixed(0)}%-${(centerXMax * 100).toFixed(0)}%`);
  }
  if (centerYRatio < centerYMin || centerYRatio > centerYMax) {
    violations.push(`Face center Y (${(centerYRatio * 100).toFixed(1)}%) should be within ${(centerYMin * 100).toFixed(0)}%-${(centerYMax * 100).toFixed(0)}%`);
  }
  if (faceWidthRatio < minWidthRatio || faceWidthRatio > maxWidthRatio) {
    violations.push(`Face width (${(faceWidthRatio * 100).toFixed(1)}%) should be within ${(minWidthRatio * 100).toFixed(0)}%-${(maxWidthRatio * 100).toFixed(0)}% of crop width`);
  }
  if (faceHeightRatio < minHeightRatio || faceHeightRatio > maxHeightRatio) {
    violations.push(`Head height (${(faceHeightRatio * 100).toFixed(1)}%) should be within ${(minHeightRatio * 100).toFixed(0)}%-${(maxHeightRatio * 100).toFixed(0)}% of crop height`);
  }

  if (violations.length === 0) return null;
  return createIssue(rule, checkedAt, violations.join('; '), details);
}

export function calculateFacePositionMetrics(
  faceDetection: FaceDetectionResult,
  cropWidth: number,
  cropHeight: number
): {
  isCentered: boolean;
  isProperlySized: boolean;
  centerXRatio: number;
  centerYRatio: number;
  faceWidthRatio: number;
  faceHeightRatio: number;
} | null {
  const face = faceDetection.faces[0];
  if (!face) return null;

  const faceCenterX = face.boundingBox.x + face.boundingBox.width / 2;
  const faceCenterY = face.boundingBox.y + face.boundingBox.height / 2;

  const centerXRatio = faceCenterX / cropWidth;
  const centerYRatio = faceCenterY / cropHeight;
  const faceWidthRatio = face.boundingBox.width / cropWidth;
  const faceHeightRatio = face.boundingBox.height / cropHeight;

  return {
    isCentered: centerXRatio >= 0.35 && centerXRatio <= 0.65 && centerYRatio >= 0.25 && centerYRatio <= 0.65,
    isProperlySized: faceWidthRatio >= 0.25 && faceWidthRatio <= 0.65 && faceHeightRatio >= 0.35 && faceHeightRatio <= 0.80,
    centerXRatio,
    centerYRatio,
    faceWidthRatio,
    faceHeightRatio,
  };
}
