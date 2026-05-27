import { CropState, ProcessingSettings, ImageAsset, ImageMetadata, UploadStatus } from '../domain/assets';
import { ExportSettings } from '../domain/export';
import { LocalUserPreferences, EditorPreferences, ExportPreferences, PrivacySettings, NotificationPreferences, PresetPreferences } from '../domain/preferences';
import { EditorSession, EditorUIState, EditorHistory } from '../domain/editor-session';

/**
 * Create default crop state
 */
export function createDefaultCropState(overrides?: Partial<CropState>): CropState {
  return {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotation: 0,
    scale: 1,
    flipHorizontal: false,
    flipVertical: false,
    ...overrides,
  };
}

/**
 * Create default processing settings
 */
export function createDefaultProcessingSettings(overrides?: Partial<ProcessingSettings>): ProcessingSettings {
  return {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    sharpness: 0,
    background: {
      mode: 'original',
    },
    skinSmoothing: 0,
    redEyeReduction: false,
    autoEnhance: false,
    grayscale: false,
    ...overrides,
  };
}

/**
 * Create default export settings
 */
export function createDefaultExportSettings(overrides?: Partial<ExportSettings>): ExportSettings {
  return {
    format: 'jpeg',
    quality: 0.95,
    colorMode: 'rgb',
    widthPx: 600,
    heightPx: 800,
    dpi: 300,
    printLayout: 'single',
    printSizes: [],
    colorProfile: 'sRGB',
    printBackgroundColor: '#FFFFFF',
    filename: 'photo',
    filenameSuffix: 'preset',
    destination: 'download',
    includeMetadata: false,
    stripExif: true,
    optimizeForWeb: false,
    ...overrides,
  };
}

/**
 * Create default editor UI state
 */
export function createDefaultEditorUIState(overrides?: Partial<EditorUIState>): EditorUIState {
  return {
    activeTool: 'select',
    viewMode: 'single',
    zoomLevel: 1,
    panX: 0,
    panY: 0,
    showGrid: false,
    showGuides: true,
    showFaceOverlay: true,
    darkMode: false,
    panels: {
      showCropPanel: true,
      showProcessingPanel: true,
      showValidationPanel: true,
      showExportPanel: false,
      showHelpPanel: false,
    },
    ...overrides,
  };
}

/**
 * Create default editor history
 */
export function createDefaultEditorHistory(overrides?: Partial<EditorHistory>): EditorHistory {
  return {
    entries: [],
    currentIndex: -1,
    maxSize: 50,
    ...overrides,
  };
}

/**
 * Create default editor session
 */
export function createDefaultEditorSession(overrides?: Partial<EditorSession>): EditorSession {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    asset: undefined,
    preset: undefined,
    cropState: undefined,
    processingSettings: createDefaultProcessingSettings(),
    faceAnalysis: undefined,
    validationResult: undefined,
    uiState: createDefaultEditorUIState(),
    history: createDefaultEditorHistory(),
    isDirty: false,
    isProcessing: false,
    processingProgress: 0,
    ...overrides,
  };
}

/**
 * Create default privacy settings
 */
export function createDefaultPrivacySettings(overrides?: Partial<PrivacySettings>): PrivacySettings {
  return {
    persistImages: false,
    sessionRetentionHours: 24,
    allowAnalytics: false,
    allowErrorReporting: false,
    autoDeleteAfterExport: true,
    ...overrides,
  };
}

/**
 * Create default notification preferences
 */
export function createDefaultNotificationPreferences(overrides?: Partial<NotificationPreferences>): NotificationPreferences {
  return {
    onProcessingComplete: true,
    onExportComplete: true,
    validationWarnings: true,
    errorNotifications: true,
    helpTooltips: true,
    ...overrides,
  };
}

/**
 * Create default editor preferences
 */
export function createDefaultEditorPreferences(overrides?: Partial<EditorPreferences>): EditorPreferences {
  return {
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
    ...overrides,
  };
}

/**
 * Create default export preferences
 */
export function createDefaultExportPreferences(overrides?: Partial<ExportPreferences>): ExportPreferences {
  return {
    defaultFormat: 'jpeg',
    defaultQuality: 0.95,
    defaultDpi: 300,
    includeMetadata: false,
    autoTimestampFilename: true,
    defaultPrintLayout: 'single',
    confirmLargeFiles: true,
    recentLocations: [],
    ...overrides,
  };
}

/**
 * Create default preset preferences
 */
export function createDefaultPresetPreferences(overrides?: Partial<PresetPreferences>): PresetPreferences {
  return {
    favoritePresetIds: [],
    recentPresetIds: [],
    showCountryFilter: true,
    groupByDocumentType: false,
    ...overrides,
  };
}

/**
 * Create default user preferences
 */
export function createDefaultUserPreferences(overrides?: Partial<LocalUserPreferences>): LocalUserPreferences {
  const now = new Date().toISOString();
  return {
    version: '1.0.0',
    theme: 'system',
    language: 'en',
    measurementUnit: 'metric',
    editor: createDefaultEditorPreferences(),
    export: createDefaultExportPreferences(),
    presets: createDefaultPresetPreferences(),
    privacy: createDefaultPrivacySettings(),
    notifications: createDefaultNotificationPreferences(),
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Create default image metadata
 */
export function createDefaultImageMetadata(overrides?: Partial<ImageMetadata>): ImageMetadata {
  return {
    width: 0,
    height: 0,
    aspectRatio: 1,
    format: 'unknown',
    colorMode: 'unknown',
    hasAlpha: false,
    fileSizeBytes: 0,
    ...overrides,
  };
}

/**
 * Create default image asset
 */
export function createDefaultImageAsset(overrides?: Partial<ImageAsset>): ImageAsset {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: 'untitled',
    metadata: createDefaultImageMetadata(),
    status: 'pending',
    uploadedAt: now,
    ...overrides,
  };
}

/**
 * Preset IDs for common document types
 */
export const COMMON_PRESET_IDS = {
  US_PASSPORT: 'us-passport-2x2',
  US_VISA: 'us-visa-2x2',
  UK_PASSPORT: 'uk-passport-35x45',
  EU_PASSPORT: 'eu-passport-35x45',
  CANADA_PASSPORT: 'ca-passport-50x70',
  INDIA_PASSPORT: 'in-passport-35x45',
  AUSTRALIA_PASSPORT: 'au-passport-35x45',
  CHINA_PASSPORT: 'cn-passport-33x48',
  JAPAN_PASSPORT: 'jp-passport-35x45',
} as const;

/**
 * Common preset dimensions in millimeters
 */
export const PRESET_DIMENSIONS_MM = {
  'us-passport-2x2': { widthMm: 51, heightMm: 51, name: 'US Passport (2×2")' },
  'us-visa-2x2': { widthMm: 51, heightMm: 51, name: 'US Visa (2×2")' },
  'uk-passport-35x45': { widthMm: 35, heightMm: 45, name: 'UK Passport (35×45mm)' },
  'eu-passport-35x45': { widthMm: 35, heightMm: 45, name: 'EU Passport (35×45mm)' },
  'ca-passport-50x70': { widthMm: 50, heightMm: 70, name: 'Canada Passport (50×70mm)' },
  'in-passport-35x45': { widthMm: 35, heightMm: 45, name: 'India Passport (35×45mm)' },
  'au-passport-35x45': { widthMm: 35, heightMm: 45, name: 'Australia Passport (35×45mm)' },
  'cn-passport-33x48': { widthMm: 33, heightMm: 48, name: 'China Passport (33×48mm)' },
  'jp-passport-35x45': { widthMm: 35, heightMm: 45, name: 'Japan Passport (35×45mm)' },
} as const;

/**
 * Get pixel dimensions for a preset at specific DPI
 */
export function getPresetPixelDimensions(
  presetId: keyof typeof PRESET_DIMENSIONS_MM,
  dpi: number = 300
): { widthPx: number; heightPx: number } {
  const dims = PRESET_DIMENSIONS_MM[presetId];
  if (!dims) {
    return { widthPx: 0, heightPx: 0 };
  }
  
  // mm to inches to pixels
  const widthPx = Math.round((dims.widthMm / 25.4) * dpi);
  const heightPx = Math.round((dims.heightMm / 25.4) * dpi);
  
  return { widthPx, heightPx };
}

/**
 * Reset session to initial state while keeping ID and timestamps
 */
export function resetSession(session: EditorSession): EditorSession {
  const now = new Date().toISOString();
  return {
    ...session,
    asset: undefined,
    preset: undefined,
    cropState: undefined,
    processingSettings: createDefaultProcessingSettings(),
    faceAnalysis: undefined,
    validationResult: undefined,
    uiState: createDefaultEditorUIState(),
    history: createDefaultEditorHistory(),
    isDirty: false,
    isProcessing: false,
    processingProgress: 0,
    errorMessage: undefined,
    updatedAt: now,
  };
}

/**
 * Create minimal export settings from preset dimensions
 */
export function createExportSettingsFromPreset(
  widthMm: number,
  heightMm: number,
  dpi: number = 300
): ExportSettings {
  const widthPx = Math.round((widthMm / 25.4) * dpi);
  const heightPx = Math.round((heightMm / 25.4) * dpi);
  
  return createDefaultExportSettings({
    widthPx,
    heightPx,
    dpi,
    filename: 'passport-photo',
    filenameSuffix: 'date',
  });
}
