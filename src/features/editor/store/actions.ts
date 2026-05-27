import useEditorStore from './editor-store';
import type {
  PhotoPreset,
  ImageAsset,
  CropState,
  ProcessingSettings,
  FaceAnalysis,
  ExportSettings,
  ValidationIssue,
  LocalUserPreferences,
} from '@/domain';
import type { CustomSize } from './editor-store';

// ============================================
// Hook Exports for React Components
// ============================================

/**
 * Hook to get all editor actions
 */
export function useEditorActions() {
  const store = useEditorStore();

  return {
    selectPreset: store.selectPreset,
    setCustomSize: store.setCustomSize,
    updateCustomSize: store.updateCustomSize,
    setAsset: store.setAsset,
    replaceAsset: store.replaceAsset,
    clearAsset: store.clearAsset,
    updateAssetMetadata: store.updateAssetMetadata,
    updateCrop: store.updateCrop,
    updateCropPartial: store.updateCropPartial,
    resetCrop: store.resetCrop,
    updateProcessingSettings: store.updateProcessingSettings,
    updateProcessingPartial: store.updateProcessingPartial,
    resetProcessingSettings: store.resetProcessingSettings,
    updateBackground: store.updateBackground,
    setFaceAnalysis: store.setFaceAnalysis,
    updateExportSettings: store.updateExportSettings,
    updateExportPartial: store.updateExportPartial,
    resetExportSettings: store.resetExportSettings,
    setValidationIssues: store.setValidationIssues,
    clearValidationIssues: store.clearValidationIssues,
    addValidationIssue: store.addValidationIssue,
    setImageObjectUrl: store.setImageObjectUrl,
    setIsAssetLoading: store.setIsAssetLoading,
    setIsProcessing: store.setIsProcessing,
    setIsExporting: store.setIsExporting,
    setProcessingProgress: store.setProcessingProgress,
    setExportProgress: store.setExportProgress,
    setProcessingAbortController: store.setProcessingAbortController,
    setExportAbortController: store.setExportAbortController,
    setHydrationStatus: store.setHydrationStatus,
    setPreferences: store.setPreferences,
    resetEditor: store.resetEditor,
    resetToPreset: store.resetToPreset,
  };
}

/**
 * Hook for preset selection actions
 */
export function usePresetActions() {
  const store = useEditorStore();

  return {
    selectPreset: store.selectPreset,
    resetToPreset: store.resetToPreset,
  };
}

/**
 * Hook for custom size configuration
 */
export function useCustomSizeActions() {
  const store = useEditorStore();

  return {
    customSize: store.customSize,
    setCustomSize: store.setCustomSize,
    updateCustomSize: store.updateCustomSize,
  };
}

/**
 * Hook for asset management
 */
export function useAssetActions() {
  const store = useEditorStore();

  return {
    asset: store.asset,
    setAsset: store.setAsset,
    replaceAsset: store.replaceAsset,
    clearAsset: store.clearAsset,
    updateAssetMetadata: store.updateAssetMetadata,
    isAssetLoading: store.runtime.isAssetLoading,
    setIsAssetLoading: store.setIsAssetLoading,
    imageObjectUrl: store.runtime.imageObjectUrl,
  };
}

/**
 * Hook for crop state management
 */
export function useCropActions() {
  const store = useEditorStore();

  return {
    cropState: store.cropState,
    updateCrop: store.updateCrop,
    updateCropPartial: store.updateCropPartial,
    resetCrop: store.resetCrop,
  };
}

/**
 * Hook for processing settings
 */
export function useProcessingActions() {
  const store = useEditorStore();

  return {
    processingSettings: store.processingSettings,
    updateProcessingSettings: store.updateProcessingSettings,
    updateProcessingPartial: store.updateProcessingPartial,
    resetProcessingSettings: store.resetProcessingSettings,
    updateBackground: store.updateBackground,
    isProcessing: store.runtime.isProcessing,
    setIsProcessing: store.setIsProcessing,
    processingProgress: store.runtime.processingProgress,
    setProcessingProgress: store.setProcessingProgress,
    processingAbortController: store.runtime.processingAbortController,
    setProcessingAbortController: store.setProcessingAbortController,
  };
}

/**
 * Hook for face detection
 */
export function useFaceDetectionActions() {
  const store = useEditorStore();

  return {
    faceAnalysis: store.faceAnalysis,
    setFaceAnalysis: store.setFaceAnalysis,
  };
}

/**
 * Hook for export actions
 */
export function useExportActions() {
  const store = useEditorStore();

  return {
    exportSettings: store.exportSettings,
    updateExportSettings: store.updateExportSettings,
    updateExportPartial: store.updateExportPartial,
    resetExportSettings: store.resetExportSettings,
    isExporting: store.runtime.isExporting,
    setIsExporting: store.setIsExporting,
    exportProgress: store.runtime.exportProgress,
    setExportProgress: store.setExportProgress,
    exportAbortController: store.runtime.exportAbortController,
    setExportAbortController: store.setExportAbortController,
  };
}

/**
 * Hook for validation actions
 */
export function useValidationActions() {
  const store = useEditorStore();

  return {
    validationIssues: store.validationIssues,
    setValidationIssues: store.setValidationIssues,
    clearValidationIssues: store.clearValidationIssues,
    addValidationIssue: store.addValidationIssue,
  };
}

// ============================================
// Direct Action Exports (for non-React context)
// ============================================

/**
 * Select a preset directly
 */
export function selectPreset(preset: PhotoPreset | null): void {
  useEditorStore.getState().selectPreset(preset);
}

/**
 * Set custom size directly
 */
export function setCustomSize(size: CustomSize | null): void {
  useEditorStore.getState().setCustomSize(size);
}

/**
 * Set asset with optional file directly
 */
export function setAsset(asset: ImageAsset | null, file?: File): void {
  useEditorStore.getState().setAsset(asset, file);
}

/**
 * Clear the current asset
 */
export function clearAsset(): void {
  useEditorStore.getState().clearAsset();
}

/**
 * Update crop state directly
 */
export function updateCrop(crop: CropState | null): void {
  useEditorStore.getState().updateCrop(crop);
}

/**
 * Update crop state partially
 */
export function updateCropPartial(partial: Partial<CropState>): void {
  useEditorStore.getState().updateCropPartial(partial);
}

/**
 * Update processing settings directly
 */
export function updateProcessingSettings(settings: ProcessingSettings): void {
  useEditorStore.getState().updateProcessingSettings(settings);
}

/**
 * Update processing settings partially
 */
export function updateProcessingPartial(partial: Partial<ProcessingSettings>): void {
  useEditorStore.getState().updateProcessingPartial(partial);
}

/**
 * Update export settings directly
 */
export function updateExportSettings(settings: ExportSettings): void {
  useEditorStore.getState().updateExportSettings(settings);
}

/**
 * Update export settings partially
 */
export function updateExportPartial(partial: Partial<ExportSettings>): void {
  useEditorStore.getState().updateExportPartial(partial);
}

/**
 * Set face analysis results
 */
export function setFaceAnalysis(analysis: FaceAnalysis | null): void {
  useEditorStore.getState().setFaceAnalysis(analysis);
}

/**
 * Set validation issues
 */
export function setValidationIssues(issues: ValidationIssue[]): void {
  useEditorStore.getState().setValidationIssues(issues);
}

/**
 * Clear validation issues
 */
export function clearValidationIssues(): void {
  useEditorStore.getState().clearValidationIssues();
}

/**
 * Add a single validation issue
 */
export function addValidationIssue(issue: ValidationIssue): void {
  useEditorStore.getState().addValidationIssue(issue);
}

/**
 * Reset the editor to default state
 */
export function resetEditor(): void {
  useEditorStore.getState().resetEditor();
}

/**
 * Reset editor with a specific preset
 */
export function resetToPreset(preset: PhotoPreset): void {
  useEditorStore.getState().resetToPreset(preset);
}

/**
 * Set processing progress
 */
export function setProcessingProgress(progress: number): void {
  useEditorStore.getState().setProcessingProgress(progress);
}

/**
 * Set export progress
 */
export function setExportProgress(progress: number): void {
  useEditorStore.getState().setExportProgress(progress);
}

// ============================================
// Batch Action Utilities
// ============================================

/**
 * Apply a complete preset configuration including size and defaults
 */
export function applyPresetConfiguration(preset: PhotoPreset): void {
  const { selectPreset, resetExportSettings, clearValidationIssues } = useEditorStore.getState();

  selectPreset(preset);
  resetExportSettings();
  clearValidationIssues();
}

/**
 * Apply a complete custom size configuration
 */
export function applyCustomSizeConfiguration(size: CustomSize): void {
  const { setCustomSize, resetExportSettings, clearValidationIssues } = useEditorStore.getState();

  setCustomSize(size);
  resetExportSettings();
  clearValidationIssues();
}

/**
 * Update multiple processing settings at once
 */
export function batchUpdateProcessing(updates: Partial<ProcessingSettings>): void {
  useEditorStore.getState().updateProcessingPartial(updates);
}

/**
 * Update multiple export settings at once
 */
export function batchUpdateExport(updates: Partial<ExportSettings>): void {
  useEditorStore.getState().updateExportPartial(updates);
}

// ============================================
// Async Action Wrappers
// ============================================

/**
 * Start processing with progress tracking
 */
export async function startProcessing(
  processFn: (onProgress: (progress: number) => void, abortSignal: AbortSignal) => Promise<void>
): Promise<void> {
  const state = useEditorStore.getState();

  // Create abort controller for cancellation
  const abortController = new AbortController();
  state.setProcessingAbortController(abortController);
  state.setIsProcessing(true);
  state.setProcessingProgress(0);

  try {
    await processFn(
      (progress) => state.setProcessingProgress(progress),
      abortController.signal
    );
    state.setProcessingProgress(1);
  } finally {
    state.setIsProcessing(false);
    state.setProcessingAbortController(undefined);
  }
}

/**
 * Start export with progress tracking
 */
export async function startExport(
  exportFn: (onProgress: (progress: number) => void, abortSignal: AbortSignal) => Promise<void>
): Promise<void> {
  const state = useEditorStore.getState();

  const abortController = new AbortController();
  state.setExportAbortController(abortController);
  state.setIsExporting(true);
  state.setExportProgress(0);

  try {
    await exportFn(
      (progress) => state.setExportProgress(progress),
      abortController.signal
    );
    state.setExportProgress(1);
  } finally {
    state.setIsExporting(false);
    state.setExportAbortController(undefined);
  }
}

/**
 * Cancel ongoing processing
 */
export function cancelProcessing(): void {
  const state = useEditorStore.getState();
  const controller = state.runtime.processingAbortController;

  if (controller) {
    controller.abort();
    state.setProcessingAbortController(undefined);
    state.setIsProcessing(false);
  }
}

/**
 * Cancel ongoing export
 */
export function cancelExport(): void {
  const state = useEditorStore.getState();
  const controller = state.runtime.exportAbortController;

  if (controller) {
    controller.abort();
    state.setExportAbortController(undefined);
    state.setIsExporting(false);
  }
}
