import { useEditorStore, type EditorState, type EditorStore } from './editor-store';
import type {
  PhotoPreset,
  ImageAsset,
  CropState,
  ProcessingSettings,
  FaceAnalysis,
  ExportSettings,
  ValidationIssue,
  ValidationSeverity,
} from '@/domain';

type Selector<T> = (state: EditorState) => T;

// ============================================
// Basic State Selectors (hooks for React)
// ============================================

export function useSelectedPreset(): PhotoPreset | null {
  return useEditorStore((state: EditorStore) => state.selectedPreset);
}

export function useCustomSize() {
  return useEditorStore((state: EditorStore) => state.customSize);
}

export function useAsset(): ImageAsset | null {
  return useEditorStore((state: EditorStore) => state.asset);
}

export function useCropState(): CropState | null {
  return useEditorStore((state: EditorStore) => state.cropState);
}

export function useProcessingSettings(): ProcessingSettings {
  return useEditorStore((state: EditorStore) => state.processingSettings);
}

export function useFaceAnalysis(): FaceAnalysis | null {
  return useEditorStore((state: EditorStore) => state.faceAnalysis);
}

export function useExportSettings(): ExportSettings | null {
  return useEditorStore((state: EditorStore) => state.exportSettings);
}

export function useValidationIssues(): ValidationIssue[] {
  return useEditorStore((state: EditorStore) => state.validationIssues);
}

export function useHydrationStatus() {
  return useEditorStore((state: EditorStore) => state.hydrationStatus);
}

export function useRuntimeState() {
  return useEditorStore((state: EditorStore) => state.runtime);
}

export function useIsEditorReady(): boolean {
  return useEditorStore((state: EditorStore) => state.hydrationStatus.isHydrated);
}

// ============================================
// Computed Selectors (hooks)
// ============================================

export function useIsPresetMode(): boolean {
  return useEditorStore((state: EditorStore) => state.selectedPreset !== null);
}

export function useIsCustomSizeMode(): boolean {
  return useEditorStore((state: EditorStore) => state.customSize !== null);
}

export function useHasAsset(): boolean {
  return useEditorStore((state: EditorStore) => state.asset !== null);
}

export function useRequiredAspectRatio(): number | null {
  return useEditorStore((state: EditorStore) => {
    if (state.selectedPreset) {
      return state.selectedPreset.dimensions.widthMm / state.selectedPreset.dimensions.heightMm;
    }
    if (state.customSize) {
      return state.customSize.widthMm / state.customSize.heightMm;
    }
    return null;
  });
}

export function useTargetDimensions(): { width: number; height: number; dpi: number } | null {
  return useEditorStore((state: EditorStore) => {
    if (state.exportSettings) {
      return {
        width: state.exportSettings.widthPx,
        height: state.exportSettings.heightPx,
        dpi: state.exportSettings.dpi,
      };
    }
    if (state.selectedPreset) {
      const { dimensions } = state.selectedPreset;
      const dpi = dimensions.minDpi || 300;
      return {
        width: dimensions.widthPx ?? Math.round((dimensions.widthMm / 25.4) * dpi),
        height: dimensions.heightPx ?? Math.round((dimensions.heightMm / 25.4) * dpi),
        dpi,
      };
    }
    if (state.customSize) {
      const { widthMm, heightMm, dpi } = state.customSize;
      return {
        width: Math.round((widthMm / 25.4) * dpi),
        height: Math.round((heightMm / 25.4) * dpi),
        dpi,
      };
    }
    return null;
  });
}

export function useHasValidationErrors(): boolean {
  return useEditorStore((state: EditorStore) =>
    state.validationIssues.some((issue) => issue.severity === 'error')
  );
}

export function useHasValidationWarnings(): boolean {
  return useEditorStore((state: EditorStore) =>
    state.validationIssues.some((issue) => issue.severity === 'warning')
  );
}

export function useValidationIssuesBySeverity(severity: ValidationSeverity): ValidationIssue[] {
  return useEditorStore((state: EditorStore) =>
    state.validationIssues.filter((issue) => issue.severity === severity)
  );
}

export function usePrimaryFace() {
  return useEditorStore((state: EditorStore) => {
    if (!state.faceAnalysis || state.faceAnalysis.faces.length === 0) {
      return null;
    }

    const { primaryFaceIndex, faces } = state.faceAnalysis;

    if (primaryFaceIndex !== undefined && faces[primaryFaceIndex]) {
      return faces[primaryFaceIndex];
    }

    return faces.reduce((prev, current) =>
      current.boundingBox.confidence > prev.boundingBox.confidence ? current : prev
    );
  });
}

export function useIsCropValid(): boolean {
  return useEditorStore((state: EditorStore) => {
    if (!state.cropState) return false;

    const { width, height } = state.cropState;
    if (width <= 0 || height <= 0) return false;

    if (state.cropState.aspectRatio !== undefined) {
      const tolerance = 0.01;
      const actualRatio = width / height;
      if (Math.abs(actualRatio - state.cropState.aspectRatio) > tolerance) {
        return false;
      }
    }

    return true;
  });
}

export function useProcessedImageUrl(): string | undefined {
  return useEditorStore((state: EditorStore) => state.runtime.imageObjectUrl);
}

export function useCanExport(): boolean {
  return useEditorStore((state: EditorStore) => {
    const hasAsset = state.asset !== null;
    const hasCrop = state.cropState !== null;
    const hasNoErrors = state.validationIssues.every((issue) => issue.severity !== 'error');
    const notProcessing = !state.runtime.isProcessing;

    return hasAsset && hasCrop && hasNoErrors && notProcessing;
  });
}

export function useHasUnsavedChanges(): boolean {
  return useEditorStore((state: EditorStore) => state.asset !== null && state.cropState !== null);
}

export function useLoadingStates() {
  return useEditorStore((state: EditorStore) => ({
    isAssetLoading: state.runtime.isAssetLoading,
    isProcessing: state.runtime.isProcessing,
    isExporting: state.runtime.isExporting,
    isBusy: state.runtime.isAssetLoading || state.runtime.isProcessing || state.runtime.isExporting,
  }));
}

export function useProgressState() {
  return useEditorStore((state: EditorStore) => ({
    processingProgress: state.runtime.processingProgress,
    exportProgress: state.runtime.exportProgress,
  }));
}

export function useAbortControllers() {
  return useEditorStore((state: EditorStore) => ({
    processingAbortController: state.runtime.processingAbortController,
    exportAbortController: state.runtime.exportAbortController,
    canCancelProcessing: state.runtime.processingAbortController !== undefined,
    canCancelExport: state.runtime.exportAbortController !== undefined,
  }));
}

// ============================================
// Static Selectors (for use outside React)
// ============================================

export const Selectors = {
  selectedPreset(state: EditorState): PhotoPreset | null {
    return state.selectedPreset;
  },
  asset(state: EditorState): ImageAsset | null {
    return state.asset;
  },
  hasAsset(state: EditorState): boolean {
    return state.asset !== null;
  },
  cropState(state: EditorState): CropState | null {
    return state.cropState;
  },
  processingSettings(state: EditorState): ProcessingSettings {
    return state.processingSettings;
  },
  faceAnalysis(state: EditorState): FaceAnalysis | null {
    return state.faceAnalysis;
  },
  exportSettings(state: EditorState): ExportSettings | null {
    return state.exportSettings;
  },
  validationIssues(state: EditorState): ValidationIssue[] {
    return state.validationIssues;
  },
  hasValidationErrors(state: EditorState): boolean {
    return state.validationIssues.some((issue) => issue.severity === 'error');
  },
  isPresetMode(state: EditorState): boolean {
    return state.selectedPreset !== null;
  },
  isCustomSizeMode(state: EditorState): boolean {
    return state.customSize !== null;
  },
  requiredAspectRatio(state: EditorState): number | null {
    if (state.selectedPreset) {
      return state.selectedPreset.dimensions.widthMm / state.selectedPreset.dimensions.heightMm;
    }
    if (state.customSize) {
      return state.customSize.widthMm / state.customSize.heightMm;
    }
    return null;
  },
  targetDimensions(
    state: EditorState
  ): { width: number; height: number; dpi: number } | null {
    if (state.exportSettings) {
      return {
        width: state.exportSettings.widthPx,
        height: state.exportSettings.heightPx,
        dpi: state.exportSettings.dpi,
      };
    }
    if (state.selectedPreset) {
      const { dimensions } = state.selectedPreset;
      const dpi = dimensions.minDpi || 300;
      return {
        width: dimensions.widthPx ?? Math.round((dimensions.widthMm / 25.4) * dpi),
        height: dimensions.heightPx ?? Math.round((dimensions.heightMm / 25.4) * dpi),
        dpi,
      };
    }
    if (state.customSize) {
      const { widthMm, heightMm, dpi } = state.customSize;
      return {
        width: Math.round((widthMm / 25.4) * dpi),
        height: Math.round((heightMm / 25.4) * dpi),
        dpi: dpi,
      };
    }
    return null;
  },
  canExport(state: EditorState): boolean {
    const hasAsset = state.asset !== null;
    const hasCrop = state.cropState !== null;
    const hasNoErrors = state.validationIssues.every((issue) => issue.severity !== 'error');
    const notProcessing = !state.runtime.isProcessing;
    return hasAsset && hasCrop && hasNoErrors && notProcessing;
  },
  hasUnsavedChanges(state: EditorState): boolean {
    return state.asset !== null && state.cropState !== null;
  },
  primaryFace(state: EditorState) {
    if (!state.faceAnalysis || state.faceAnalysis.faces.length === 0) {
      return null;
    }
    const { primaryFaceIndex, faces } = state.faceAnalysis;
    if (primaryFaceIndex !== undefined && faces[primaryFaceIndex]) {
      return faces[primaryFaceIndex];
    }
    return faces.reduce((prev, current) =>
      current.boundingBox.confidence > prev.boundingBox.confidence ? current : prev
    );
  },
};

// ============================================
// Complex Computed Selectors (hooks)
// ============================================

export function useEditorSummary() {
  return useEditorStore((state: EditorStore) => ({
    mode: state.selectedPreset ? 'preset' : state.customSize ? 'custom' : 'none',
    presetName: state.selectedPreset?.name ?? null,
    hasAsset: state.asset !== null,
    assetName: state.asset?.name ?? null,
    hasCrop: state.cropState !== null,
    cropDimensions: state.cropState
      ? { width: state.cropState.width, height: state.cropState.height }
      : null,
    hasFaceAnalysis: state.faceAnalysis !== null,
    faceCount: state.faceAnalysis?.faces.length ?? 0,
    validationErrorCount: state.validationIssues.filter((i) => i.severity === 'error').length,
    validationWarningCount: state.validationIssues.filter((i) => i.severity === 'warning').length,
    canExport:
      state.asset !== null &&
      state.cropState !== null &&
      state.validationIssues.every((i) => i.severity !== 'error') &&
      !state.runtime.isProcessing,
  }));
}

export function usePresetCompliance() {
  return useEditorStore((state: EditorStore) => {
    if (!state.selectedPreset) {
      return null;
    }
    return {
      name: state.selectedPreset.name,
      country: state.selectedPreset.country,
      documentType: state.selectedPreset.documentType,
      dimensions: state.selectedPreset.dimensions,
      background: state.selectedPreset.background,
      facePosition: state.selectedPreset.facePosition,
    };
  });
}

export default Selectors;
