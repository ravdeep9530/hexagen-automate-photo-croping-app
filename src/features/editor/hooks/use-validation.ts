'use client';

import { useCallback, useMemo, useState } from 'react';

import { COMPLIANCE_RULESETS_BY_PRESET_ID } from '@/data/compliance-rules';
import type { ManualChecklistItem } from '@/domain/compliance';
import { useEditorStore } from '../store/editor-store';
import { validateCompliance, type ComplianceValidationResult } from '../validation/validation-engine';
import type { FaceDetectionResult } from '../validation/rule-evaluators';

export interface UseValidationResult {
  validation: ComplianceValidationResult | null;
  manualChecklist: ManualChecklistItem[];
  errorCount: number;
  warningCount: number;
  infoCount: number;
  hasErrors: boolean;
  isValid: boolean;
  revalidate: () => void;
  updateManualChecklist: (itemId: string, checked: boolean) => void;
}

export function useValidation(): UseValidationResult {
  const preset = useEditorStore((s) => s.selectedPreset);
  const asset = useEditorStore((s) => s.asset);
  const crop = useEditorStore((s) => s.cropState);
  const processing = useEditorStore((s) => s.processingSettings);
  const exportSettings = useEditorStore((s) => s.exportSettings);
  const faceAnalysis = useEditorStore((s) => s.faceAnalysis);
  const [manualChecks, setManualChecks] = useState<Record<string, { isChecked: boolean; checkedAt?: string }>>({});
  const [retrigger, setRetrigger] = useState(0);

  const rules = useMemo(() => {
    if (!preset) return [];
    return COMPLIANCE_RULESETS_BY_PRESET_ID.get(preset.id)?.rules ?? [];
  }, [preset]);

  const faceDetection = useMemo<FaceDetectionResult | null>(() => {
    if (!faceAnalysis) return null;
    return {
      faceCount: faceAnalysis.faces.length,
      faces: faceAnalysis.faces.map((face) => ({
        boundingBox: {
          x: face.boundingBox.x,
          y: face.boundingBox.y,
          width: face.boundingBox.width,
          height: face.boundingBox.height,
        },
        landmarks: face.landmarks
          ? Object.fromEntries(
              Object.entries(face.landmarks).map(([key, point]) => [key, { x: point.x, y: point.y }])
            )
          : undefined,
      })),
    };
  }, [faceAnalysis]);

  const validation = useMemo<ComplianceValidationResult | null>(() => {
    if (!preset || !asset || rules.length === 0) {
      return null;
    }

    return validateCompliance({
      presetId: preset.id,
      rules,
      asset: {
        widthPx: asset.metadata.width,
        heightPx: asset.metadata.height,
        fileSizeBytes: asset.metadata.fileSizeBytes,
        mimeType: `image/${asset.metadata.format === 'jpg' ? 'jpeg' : asset.metadata.format}`,
        filename: asset.name,
      },
      crop: crop
        ? {
            widthPx: Math.round(crop.width),
            heightPx: Math.round(crop.height),
            x: crop.x,
            y: crop.y,
            rotation: crop.rotation ?? 0,
          }
        : undefined,
      processing: {
        backgroundColor: processing.background.mode === 'replace' ? processing.background.color : undefined,
        targetDpi: exportSettings?.dpi,
      },
      exportSettings: exportSettings
        ? {
            format: exportSettings.format === 'png' ? 'png' : 'jpeg',
            quality: exportSettings.quality,
            targetWidthPx: exportSettings.widthPx,
            targetHeightPx: exportSettings.heightPx,
            targetDpi: exportSettings.dpi,
          }
        : undefined,
      faceDetection,
    });
  }, [preset, asset, crop, processing, exportSettings, faceDetection, rules, retrigger]);

  const manualChecklist = useMemo<ManualChecklistItem[]>(() => {
    return (validation?.manualChecklist ?? []).map((item) => ({
      ...item,
      isChecked: manualChecks[item.ruleId]?.isChecked ?? item.isChecked,
      checkedAt: manualChecks[item.ruleId]?.checkedAt,
    }));
  }, [manualChecks, validation?.manualChecklist]);

  const errorCount = validation?.issues.filter((i) => i.severity === 'error').length ?? 0;
  const warningCount = validation?.issues.filter((i) => i.severity === 'warning').length ?? 0;
  const infoCount = validation?.issues.filter((i) => i.severity === 'info').length ?? 0;
  const hasErrors = errorCount > 0;
  const isValid = validation?.isValid ?? false;

  const revalidate = useCallback(() => {
    setRetrigger((value) => value + 1);
  }, []);

  const updateManualChecklist = useCallback((ruleId: string, checked: boolean) => {
    setManualChecks((current) => ({
      ...current,
      [ruleId]: {
        isChecked: checked,
        checkedAt: checked ? new Date().toISOString() : undefined,
      },
    }));
  }, []);

  return {
    validation,
    manualChecklist,
    errorCount,
    warningCount,
    infoCount,
    hasErrors,
    isValid,
    revalidate,
    updateManualChecklist,
  };
}
