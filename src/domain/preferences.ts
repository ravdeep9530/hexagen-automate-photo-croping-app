import { z } from 'zod';

/**
 * Theme mode preference
 */
export const ThemeModeSchema = z.enum(['light', 'dark', 'system']);
export type ThemeMode = z.infer<typeof ThemeModeSchema>;

/**
 * Language preference
 */
export const LanguageSchema = z.enum([
  'en', // English
  'es', // Spanish
  'fr', // French
  'de', // German
  'it', // Italian
  'pt', // Portuguese
  'zh', // Chinese
  'ja', // Japanese
  'ko', // Korean
  'hi', // Hindi
  'ar', // Arabic
]);
export type Language = z.infer<typeof LanguageSchema>;

/**
 * Measurement unit preference
 */
export const MeasurementUnitSchema = z.enum(['metric', 'imperial']);
export type MeasurementUnit = z.infer<typeof MeasurementUnitSchema>;

/**
 * Privacy settings
 */
export const PrivacySettingsSchema = z.object({
  // Whether to persist images in local storage
  persistImages: z.boolean().default(false),
  // Session retention time in hours (0 = don't persist)
  sessionRetentionHours: z.number().int().min(0).max(720).default(24),
  // Whether to send anonymous usage analytics
  allowAnalytics: z.boolean().default(false),
  // Whether to enable error reporting
  allowErrorReporting: z.boolean().default(false),
  // Last privacy notice version accepted
  acceptedPrivacyVersion: z.string().optional(),
  // Auto-delete processed images after export
  autoDeleteAfterExport: z.boolean().default(true),
});

export type PrivacySettings = z.infer<typeof PrivacySettingsSchema>;

/**
 * Notification preferences
 */
export const NotificationPreferencesSchema = z.object({
  // Show processing completion notification
  onProcessingComplete: z.boolean().default(true),
  // Show export completion notification
  onExportComplete: z.boolean().default(true),
  // Show validation warnings
  validationWarnings: z.boolean().default(true),
  // Show processing errors
  errorNotifications: z.boolean().default(true),
  // Show help tooltips
  helpTooltips: z.boolean().default(true),
});

export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;

/**
 * Editor preferences
 */
export const EditorPreferencesSchema = z.object({
  // Default zoom level for editor (1 = 100%)
  defaultZoom: z.number().positive().default(1),
  // Auto-fit image on load
  autoFitOnLoad: z.boolean().default(true),
  // Show alignment guides
  showGuides: z.boolean().default(true),
  // Grid overlay density (0 = off, 1 = light, 2 = heavy)
  gridDensity: z.number().int().min(0).max(2).default(0),
  // Default processing preset
  defaultProcessingPreset: z.enum(['none', 'portrait', 'document', 'vivid']).default('none'),
  // Keyboard shortcuts enabled
  keyboardShortcuts: z.boolean().default(true),
  // Show face detection overlay by default
  showFaceOverlay: z.boolean().default(true),
  // Show compliance rules panel
  showCompliancePanel: z.boolean().default(true),
  // Auto-validate on changes
  autoValidate: z.boolean().default(true),
  // Validation debounce delay in ms
  validationDebounceMs: z.number().int().min(100).max(5000).default(500),
});

export type EditorPreferences = z.infer<typeof EditorPreferencesSchema>;

/**
 * Export preferences
 */
export const ExportPreferencesSchema = z.object({
  // Default export format
  defaultFormat: z.enum(['jpeg', 'png', 'webp']).default('jpeg'),
  // Default quality (0-1)
  defaultQuality: z.number().min(0.5).max(1).default(0.95),
  // Default DPI
  defaultDpi: z.number().positive().default(300),
  // Include metadata by default
  includeMetadata: z.boolean().default(false),
  // Auto-generate filename with timestamp
  autoTimestampFilename: z.boolean().default(true),
  // Default print layout
  defaultPrintLayout: z.enum(['single', '4x6-4up', 'a4-6up']).default('single'),
  // Ask for confirmation before large files (>5MB)
  confirmLargeFiles: z.boolean().default(true),
  // Recent export locations
  recentLocations: z.array(z.string()).max(5).default([]),
});

export type ExportPreferences = z.infer<typeof ExportPreferencesSchema>;

/**
 * Preset preferences
 */
export const PresetPreferencesSchema = z.object({
  // Last used preset ID
  lastUsedPresetId: z.string().optional(),
  // Favorite preset IDs
  favoritePresetIds: z.array(z.string()).default([]),
  // Recently used preset IDs (max 10)
  recentPresetIds: z.array(z.string()).max(10).default([]),
  // Show country filter by default
  showCountryFilter: z.boolean().default(true),
  // Default country filter
  defaultCountry: z.string().optional(),
  // Group presets by document type
  groupByDocumentType: z.boolean().default(false),
});

export type PresetPreferences = z.infer<typeof PresetPreferencesSchema>;

/**
 * Complete local user preferences
 */
export const LocalUserPreferencesSchema = z.object({
  // Version for migration
  version: z.string().default('1.0.0'),
  
  // Appearance
  theme: ThemeModeSchema.default('system'),
  language: LanguageSchema.default('en'),
  measurementUnit: MeasurementUnitSchema.default('metric'),
  
  // Feature preferences
  editor: EditorPreferencesSchema.default({}),
  export: ExportPreferencesSchema.default({}),
  presets: PresetPreferencesSchema.default({}),
  privacy: PrivacySettingsSchema.default({}),
  notifications: NotificationPreferencesSchema.default({}),
  
  // Metadata
  updatedAt: z.string().datetime(),
});

export type LocalUserPreferences = z.infer<typeof LocalUserPreferencesSchema>;

/**
 * Persistable preferences (excluding runtime state)
 */
export const PersistablePreferencesSchema = LocalUserPreferencesSchema.omit({ updatedAt: true });
export type PersistablePreferences = z.infer<typeof PersistablePreferencesSchema>;

/**
 * Validate preferences
 */
export function validatePreferences(data: unknown): { success: true; data: LocalUserPreferences } | { success: false; error: z.ZodError } {
  const result = LocalUserPreferencesSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Merge partial preferences with defaults
 */
export function mergeWithDefaults(partial: Partial<LocalUserPreferences>): LocalUserPreferences {
  const defaults: LocalUserPreferences = {
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

  return {
    ...defaults,
    ...partial,
    editor: { ...defaults.editor, ...partial.editor },
    export: { ...defaults.export, ...partial.export },
    presets: { ...defaults.presets, ...partial.presets },
    privacy: { ...defaults.privacy, ...partial.privacy },
    notifications: { ...defaults.notifications, ...partial.notifications },
    updatedAt: partial.updatedAt || new Date().toISOString(),
  };
}

/**
 * Get language display name
 */
export function getLanguageDisplayName(lang: Language): string {
  const names: Record<Language, string> = {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    it: 'Italiano',
    pt: 'Português',
    zh: '中文',
    ja: '日本語',
    ko: '한국어',
    hi: 'हिन्दी',
    ar: 'العربية',
  };
  return names[lang];
}

/**
 * Get locale string for language
 */
export function getLanguageLocale(lang: Language): string {
  const locales: Record<Language, string> = {
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    it: 'it-IT',
    pt: 'pt-BR',
    zh: 'zh-CN',
    ja: 'ja-JP',
    ko: 'ko-KR',
    hi: 'hi-IN',
    ar: 'ar-SA',
  };
  return locales[lang];
}

/**
 * Add preset to recent list
 */
export function addPresetToRecent(
  prefs: LocalUserPreferences,
  presetId: string
): LocalUserPreferences {
  const recent = [presetId, ...prefs.presets.recentPresetIds.filter(id => id !== presetId)];
  return {
    ...prefs,
    presets: {
      ...prefs.presets,
      recentPresetIds: recent.slice(0, 10),
      lastUsedPresetId: presetId,
    },
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Toggle preset favorite status
 */
export function togglePresetFavorite(
  prefs: LocalUserPreferences,
  presetId: string
): LocalUserPreferences {
  const isFavorite = prefs.presets.favoritePresetIds.includes(presetId);
  const favorites = isFavorite
    ? prefs.presets.favoritePresetIds.filter(id => id !== presetId)
    : [...prefs.presets.favoritePresetIds, presetId];
  
  return {
    ...prefs,
    presets: {
      ...prefs.presets,
      favoritePresetIds: favorites,
    },
    updatedAt: new Date().toISOString(),
  };
}
