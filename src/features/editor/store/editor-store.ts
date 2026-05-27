import { useSyncExternalStore } from 'react';

import type {
  PhotoPreset,
  ImageAsset,
  CropState,
  ProcessingSettings,
  FaceAnalysis,
  ExportSettings,
  ValidationIssue,
  PersistableEditorSession,
  LocalUserPreferences,
} from '@/domain';

export interface CustomSize {
  widthMm: number;
  heightMm: number;
  dpi: number;
}

export interface HydrationStatus {
  isHydrated: boolean;
  isPersisting: boolean;
  lastPersistedAt?: string;
  error?: string;
}

export interface RuntimeState {
  imageObjectUrl?: string;
  originalFile?: File;
  processingAbortController?: AbortController;
  exportAbortController?: AbortController;
  isAssetLoading: boolean;
  isProcessing: boolean;
  isExporting: boolean;
  processingProgress: number;
  exportProgress: number;
}

export interface EditorState {
  selectedPreset: PhotoPreset | null;
  customSize: CustomSize | null;
  asset: ImageAsset | null;
  cropState: CropState | null;
  processingSettings: ProcessingSettings;
  faceAnalysis: FaceAnalysis | null;
  exportSettings: ExportSettings | null;
  validationIssues: ValidationIssue[];
  hydrationStatus: HydrationStatus;
  runtime: RuntimeState;
  preferences: LocalUserPreferences;
}

export interface EditorActions {
  selectPreset: (preset: PhotoPreset | null) => void;
  setCustomSize: (size: CustomSize | null) => void;
  updateCustomSize: (partial: Partial<CustomSize>) => void;
  setAsset: (asset: ImageAsset | null, file?: File) => void;
  replaceAsset: (asset: ImageAsset, file?: File) => void;
  clearAsset: () => void;
  updateAssetMetadata: (metadata: Partial<ImageAsset>) => void;
  updateCrop: (crop: CropState | null) => void;
  updateCropPartial: (partial: Partial<CropState>) => void;
  resetCrop: () => void;
  updateProcessingSettings: (settings: ProcessingSettings) => void;
  updateProcessingPartial: (partial: Partial<ProcessingSettings>) => void;
  resetProcessingSettings: () => void;
  updateBackground: (background: ProcessingSettings['background']) => void;
  setFaceAnalysis: (analysis: FaceAnalysis | null) => void;
  updateExportSettings: (settings: ExportSettings) => void;
  updateExportPartial: (partial: Partial<ExportSettings>) => void;
  resetExportSettings: () => void;
  setValidationIssues: (issues: ValidationIssue[]) => void;
  clearValidationIssues: () => void;
  addValidationIssue: (issue: ValidationIssue) => void;
  setImageObjectUrl: (url: string | undefined) => void;
  setIsAssetLoading: (loading: boolean) => void;
  setIsProcessing: (processing: boolean) => void;
  setIsExporting: (exporting: boolean) => void;
  setProcessingProgress: (progress: number) => void;
  setExportProgress: (progress: number) => void;
  setProcessingAbortController: (controller: AbortController | undefined) => void;
  setExportAbortController: (controller: AbortController | undefined) => void;
  setHydrationStatus: (status: Partial<HydrationStatus>) => void;
  setPreferences: (preferences: LocalUserPreferences) => void;
  resetEditor: () => void;
  resetToPreset: (preset: PhotoPreset) => void;
}

export type EditorStore = EditorState & EditorActions;

type Listener = () => void;
type Selector<T> = (state: EditorStore) => T;

const maybeRevoke = (url?: string) => {
  if (url && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(url);
};
const maybeCreateObjectUrl = (file?: File) =>
  file && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
    ? URL.createObjectURL(file)
    : undefined;
const aspectRatioFor = (preset: PhotoPreset) => preset.dimensions.widthMm / preset.dimensions.heightMm;
const customAspectRatioFor = (size: CustomSize) => size.widthMm / size.heightMm;
const pxFromMm = (mm: number, dpi: number) => Math.round((mm / 25.4) * dpi);
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `session-${Date.now()}`;

function createDefaultPreferences(): LocalUserPreferences {
  return {
    version: '1.0.0',
    theme: 'system',
    language: 'en',
    measurementUnit: 'metric',
    editor: {
      defaultZoom: 1,
      autoFitOnLoad: true,
      showGuides: true,
      gridDensity: 0,
      defaultProcessingPreset: 'none',
      keyboardShortcuts: true,
      showFaceOverlay: true,
      showCompliancePanel: true,
      autoValidate: true,
      validationDebounceMs: 500,
    },
    export: {
      defaultFormat: 'jpeg',
      defaultQuality: 0.95,
      defaultDpi: 300,
      includeMetadata: false,
      autoTimestampFilename: true,
      defaultPrintLayout: 'single',
      confirmLargeFiles: true,
      recentLocations: [],
    },
    presets: {
      favoritePresetIds: [],
      recentPresetIds: [],
      showCountryFilter: true,
      groupByDocumentType: false,
    },
    privacy: {
      persistImages: false,
      sessionRetentionHours: 24,
      allowAnalytics: false,
      allowErrorReporting: false,
      autoDeleteAfterExport: true,
    },
    notifications: {
      onProcessingComplete: true,
      onExportComplete: true,
      validationWarnings: true,
      errorNotifications: true,
      helpTooltips: true,
    },
    updatedAt: new Date().toISOString(),
  };
}

export function createDefaultProcessingSettings(): ProcessingSettings {
  return {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    sharpness: 0,
    background: { mode: 'original' },
    skinSmoothing: 0,
    redEyeReduction: false,
    autoEnhance: false,
    grayscale: false,
  };
}

export function createDefaultExportSettings(preset: PhotoPreset | null): ExportSettings {
  const dpi = preset?.dimensions.minDpi ?? 300;
  const widthPx = preset ? preset.dimensions.widthPx ?? pxFromMm(preset.dimensions.widthMm, dpi) : 600;
  const heightPx = preset ? preset.dimensions.heightPx ?? pxFromMm(preset.dimensions.heightMm, dpi) : 800;
  return {
    format: 'jpeg', quality: 0.95, colorMode: 'rgb', widthPx, heightPx, dpi,
    printLayout: 'single', printSizes: [], colorProfile: 'sRGB', printBackgroundColor: '#FFFFFF',
    filename: preset?.id ?? 'photo', filenameSuffix: preset ? 'preset' : 'date', destination: 'download',
    includeMetadata: false, stripExif: true, optimizeForWeb: false,
  };
}

export function createDefaultRuntimeState(): RuntimeState {
  return { isAssetLoading: false, isProcessing: false, isExporting: false, processingProgress: 0, exportProgress: 0 };
}
export function createDefaultHydrationStatus(): HydrationStatus { return { isHydrated: false, isPersisting: false }; }
export function createDefaultState(): EditorState {
  return { selectedPreset: null, customSize: null, asset: null, cropState: null, processingSettings: createDefaultProcessingSettings(), faceAnalysis: null, exportSettings: null, validationIssues: [], hydrationStatus: createDefaultHydrationStatus(), runtime: createDefaultRuntimeState(), preferences: createDefaultPreferences() };
}

function cropForAsset(asset: ImageAsset, ratio?: number): CropState {
  const { width, height } = asset.metadata;
  if (!ratio) return { x: 0, y: 0, width, height, rotation: 0, scale: 1, flipHorizontal: false, flipVertical: false };
  const cropWidth = Math.min(width, height * ratio);
  const cropHeight = cropWidth / ratio;
  return { x: (width - cropWidth) / 2, y: (height - cropHeight) / 2, width: cropWidth, height: cropHeight, rotation: 0, scale: 1, flipHorizontal: false, flipVertical: false, aspectRatio: ratio };
}
function initialCropForPreset(preset: PhotoPreset): CropState {
  const ratio = aspectRatioFor(preset);
  const width = preset.dimensions.widthPx ?? 600;
  const height = preset.dimensions.heightPx ?? Math.round(width / ratio);
  return { x: 0, y: 0, width, height, rotation: 0, scale: 1, flipHorizontal: false, flipVertical: false, aspectRatio: ratio };
}

let state: EditorStore;
const listeners = new Set<Listener>();
function emit() { listeners.forEach(listener => listener()); }
function replace(next: EditorStore) { state = next; emit(); }
function patch(updater: (draft: EditorStore) => void) {
  const draft: EditorStore = { ...state, processingSettings: { ...state.processingSettings, background: { ...state.processingSettings.background } }, runtime: { ...state.runtime }, hydrationStatus: { ...state.hydrationStatus }, validationIssues: [...state.validationIssues], cropState: state.cropState ? { ...state.cropState } : null, exportSettings: state.exportSettings ? { ...state.exportSettings, printSizes: [...state.exportSettings.printSizes] } : null };
  updater(draft);
  replace(draft);
}

function createActions(): EditorActions {
  return {
    selectPreset: (preset) => patch(draft => { const previousId = draft.selectedPreset?.id; draft.selectedPreset = preset; draft.customSize = null; if (preset) { const ratio = aspectRatioFor(preset); draft.cropState = draft.asset ? cropForAsset(draft.asset, ratio) : { ...(draft.cropState ?? initialCropForPreset(preset)), aspectRatio: ratio }; const defaults = createDefaultExportSettings(preset); draft.exportSettings = draft.exportSettings ? { ...defaults, quality: draft.exportSettings.quality, filename: draft.exportSettings.filename, filenameSuffix: draft.exportSettings.filenameSuffix, destination: draft.exportSettings.destination, includeMetadata: draft.exportSettings.includeMetadata, stripExif: draft.exportSettings.stripExif, optimizeForWeb: draft.exportSettings.optimizeForWeb } : defaults; } if (previousId !== preset?.id) { draft.faceAnalysis = null; draft.validationIssues = []; } }),
    setCustomSize: (size) => patch(draft => { draft.customSize = size; if (size) { draft.selectedPreset = null; const ratio = customAspectRatioFor(size); const widthPx = pxFromMm(size.widthMm, size.dpi); const heightPx = pxFromMm(size.heightMm, size.dpi); draft.cropState = draft.asset ? cropForAsset(draft.asset, ratio) : { x: 0, y: 0, width: widthPx, height: heightPx, rotation: 0, scale: 1, flipHorizontal: false, flipVertical: false, aspectRatio: ratio }; draft.exportSettings = { ...(draft.exportSettings ?? createDefaultExportSettings(null)), widthPx, heightPx, dpi: size.dpi }; } }),
    updateCustomSize: (partial) => patch(draft => { if (draft.customSize) draft.customSize = { ...draft.customSize, ...partial }; }),
    setAsset: (asset, file) => patch(draft => { maybeRevoke(draft.runtime.imageObjectUrl); draft.asset = asset; draft.runtime.originalFile = file; draft.runtime.imageObjectUrl = maybeCreateObjectUrl(file); draft.faceAnalysis = null; draft.validationIssues = []; if (asset) draft.cropState = cropForAsset(asset, draft.selectedPreset ? aspectRatioFor(draft.selectedPreset) : draft.customSize ? customAspectRatioFor(draft.customSize) : undefined); }),
    replaceAsset: (asset, file) => patch(draft => { maybeRevoke(draft.runtime.imageObjectUrl); draft.asset = asset; draft.runtime.originalFile = file; draft.runtime.imageObjectUrl = maybeCreateObjectUrl(file); draft.faceAnalysis = null; draft.validationIssues = []; }),
    clearAsset: () => patch(draft => { maybeRevoke(draft.runtime.imageObjectUrl); draft.asset = null; draft.runtime.originalFile = undefined; draft.runtime.imageObjectUrl = undefined; draft.cropState = null; draft.faceAnalysis = null; draft.validationIssues = []; draft.processingSettings = createDefaultProcessingSettings(); }),
    updateAssetMetadata: (metadata) => patch(draft => { if (draft.asset) draft.asset = { ...draft.asset, ...metadata }; }),
    updateCrop: (crop) => patch(draft => { draft.cropState = crop; }),
    updateCropPartial: (partial) => patch(draft => { if (draft.cropState) draft.cropState = { ...draft.cropState, ...partial }; }),
    resetCrop: () => patch(draft => { draft.cropState = draft.asset ? cropForAsset(draft.asset, draft.selectedPreset ? aspectRatioFor(draft.selectedPreset) : draft.customSize ? customAspectRatioFor(draft.customSize) : undefined) : null; }),
    updateProcessingSettings: (settings) => patch(draft => { draft.processingSettings = settings; }),
    updateProcessingPartial: (partial) => patch(draft => { draft.processingSettings = { ...draft.processingSettings, ...partial }; }),
    resetProcessingSettings: () => patch(draft => { draft.processingSettings = createDefaultProcessingSettings(); }),
    updateBackground: (background) => patch(draft => { draft.processingSettings = { ...draft.processingSettings, background }; }),
    setFaceAnalysis: (analysis) => patch(draft => { draft.faceAnalysis = analysis; }),
    updateExportSettings: (settings) => patch(draft => { draft.exportSettings = settings; }),
    updateExportPartial: (partial) => patch(draft => { if (draft.exportSettings) draft.exportSettings = { ...draft.exportSettings, ...partial }; }),
    resetExportSettings: () => patch(draft => { draft.exportSettings = createDefaultExportSettings(draft.selectedPreset); }),
    setValidationIssues: (issues) => patch(draft => { draft.validationIssues = issues; }),
    clearValidationIssues: () => patch(draft => { draft.validationIssues = []; }),
    addValidationIssue: (issue) => patch(draft => { draft.validationIssues = [...draft.validationIssues, issue]; }),
    setImageObjectUrl: (url) => patch(draft => { if (draft.runtime.imageObjectUrl !== url) maybeRevoke(draft.runtime.imageObjectUrl); draft.runtime.imageObjectUrl = url; }),
    setIsAssetLoading: (loading) => patch(draft => { draft.runtime.isAssetLoading = loading; }),
    setIsProcessing: (processing) => patch(draft => { draft.runtime.isProcessing = processing; }),
    setIsExporting: (exporting) => patch(draft => { draft.runtime.isExporting = exporting; }),
    setProcessingProgress: (progress) => patch(draft => { draft.runtime.processingProgress = clamp01(progress); }),
    setExportProgress: (progress) => patch(draft => { draft.runtime.exportProgress = clamp01(progress); }),
    setProcessingAbortController: (controller) => patch(draft => { draft.runtime.processingAbortController = controller; }),
    setExportAbortController: (controller) => patch(draft => { draft.runtime.exportAbortController = controller; }),
    setHydrationStatus: (status) => patch(draft => { draft.hydrationStatus = { ...draft.hydrationStatus, ...status }; }),
    setPreferences: (preferences) => patch(draft => { draft.preferences = preferences; }),
    resetEditor: () => patch(draft => { maybeRevoke(draft.runtime.imageObjectUrl); const preferences = draft.preferences; Object.assign(draft, createDefaultState(), createActions()); draft.preferences = preferences; }),
    resetToPreset: (preset) => patch(draft => { maybeRevoke(draft.runtime.imageObjectUrl); const preferences = draft.preferences; const asset = draft.asset; const file = draft.runtime.originalFile; Object.assign(draft, createDefaultState(), createActions()); draft.preferences = preferences; draft.asset = asset; draft.runtime.originalFile = file; draft.runtime.imageObjectUrl = maybeCreateObjectUrl(file); draft.selectedPreset = preset; draft.cropState = asset ? cropForAsset(asset, aspectRatioFor(preset)) : initialCropForPreset(preset); draft.exportSettings = createDefaultExportSettings(preset); }),
  };
}

state = { ...createDefaultState(), ...createActions() };

interface EditorStoreHook {
  (): EditorStore;
  <T>(selector: Selector<T>): T;
  getState: () => EditorStore;
  setState: (nextState: Partial<EditorStore> | EditorStore | ((state: EditorStore) => Partial<EditorStore> | EditorStore), replaceState?: boolean) => void;
  subscribe: (listener: Listener) => () => void;
}

export const useEditorStore: EditorStoreHook = (<T>(selector?: Selector<T>) => useSyncExternalStore(useEditorStore.subscribe, () => (selector ? selector(state) : state), () => (selector ? selector(state) : state))) as EditorStoreHook;
useEditorStore.getState = () => state;
useEditorStore.setState = (nextState, replaceState = false) => { const resolved = typeof nextState === 'function' ? nextState(state) : nextState; replace((replaceState ? { ...(resolved as EditorState), ...createActions() } : { ...state, ...resolved }) as EditorStore); };
useEditorStore.subscribe = (listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; };

export function exportEditorStateToSession(editorState: EditorState): PersistableEditorSession {
  const now = new Date().toISOString();
  return { id: createId(), createdAt: now, updatedAt: now, presetId: editorState.selectedPreset?.id, cropState: editorState.cropState ?? undefined, processingSettings: editorState.processingSettings, uiState: undefined, isDirty: !!editorState.asset };
}
export function hasUnsavedChanges(editorState: EditorState): boolean { return !!editorState.asset && editorState.cropState !== null; }
export function canExport(editorState: EditorState): boolean { return !!editorState.asset && !!editorState.cropState && editorState.validationIssues.every(issue => issue.severity !== 'error'); }
export default useEditorStore;
