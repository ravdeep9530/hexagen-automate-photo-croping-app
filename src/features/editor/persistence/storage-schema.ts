import type {
  CropState,
  ExportSettings,
  LocalUserPreferences,
  ProcessingSettings,
} from '@/domain';
import type { CustomSize, EditorState } from '@/features/editor/store/editor-store';

export const PERSISTENCE_SCHEMA_VERSION = 1;
export const PREFERENCES_STORAGE_KEY = 'hexagen.editor.preferences.v1';
export const SESSION_STORAGE_KEY = 'hexagen.editor.session.v1';

export type ThemePreference = 'light' | 'dark' | 'system';

export interface PersistencePrivacyPreferences {
  persistSessionEnabled: boolean;
  privacyNoticeAcknowledged: boolean;
  acknowledgedAt?: string;
}

export interface PersistedPreferences {
  schemaVersion: typeof PERSISTENCE_SCHEMA_VERSION;
  theme: ThemePreference;
  lastPresetId?: string;
  persistence: PersistencePrivacyPreferences;
  updatedAt: string;
}

export interface PersistedEditorSession {
  schemaVersion: typeof PERSISTENCE_SCHEMA_VERSION;
  savedAt: string;
  selectedPresetId?: string;
  customSize?: CustomSize | null;
  cropState?: CropState | null;
  processingSettings?: ProcessingSettings;
  exportSettings?: ExportSettings | null;
  validationIssueCount?: number;
  hasAsset: boolean;
  assetMetadata?: {
    id?: string;
    name?: string;
    type?: string;
    width?: number;
    height?: number;
    size?: number;
    lastModified?: number;
  } | null;
}

export interface StorageAdapter {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
  removeItem(key: string): Promise<void> | void;
}

export type PersistenceResult<T = undefined> =
  | { ok: true; value: T }
  | { ok: false; error: PersistenceError };

export type PersistenceErrorCode =
  | 'storage-unavailable'
  | 'quota-exceeded'
  | 'serialization-failed'
  | 'deserialization-failed'
  | 'schema-incompatible'
  | 'unknown';

export interface PersistenceError {
  code: PersistenceErrorCode;
  message: string;
  cause?: unknown;
}

export const defaultPersistedPreferences = (): PersistedPreferences => ({
  schemaVersion: PERSISTENCE_SCHEMA_VERSION,
  theme: 'system',
  persistence: {
    persistSessionEnabled: false,
    privacyNoticeAcknowledged: false,
  },
  updatedAt: new Date().toISOString(),
});

export function getLocalStorageAdapter(): PersistenceResult<StorageAdapter> {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {
      ok: false,
      error: { code: 'storage-unavailable', message: 'localStorage is not available in this environment.' },
    };
  }

  try {
    const probe = '__hexagen_storage_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return { ok: true, value: window.localStorage };
  } catch (cause) {
    return {
      ok: false,
      error: { code: classifyStorageError(cause), message: 'localStorage cannot be used.', cause },
    };
  }
}

export function classifyStorageError(cause: unknown): PersistenceErrorCode {
  if (cause instanceof DOMException) {
    if (cause.name === 'QuotaExceededError' || cause.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      return 'quota-exceeded';
    }
    if (cause.name === 'SecurityError') return 'storage-unavailable';
  }

  const maybe = cause as { name?: string; code?: number } | undefined;
  if (maybe?.name === 'QuotaExceededError' || maybe?.code === 22 || maybe?.code === 1014) {
    return 'quota-exceeded';
  }

  return 'unknown';
}

export function parseJsonObject(raw: string): PersistenceResult<Record<string, unknown>> {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ok: false, error: { code: 'deserialization-failed', message: 'Persisted value is not an object.' } };
    }
    return { ok: true, value: parsed as Record<string, unknown> };
  } catch (cause) {
    return { ok: false, error: { code: 'deserialization-failed', message: 'Persisted value is not valid JSON.', cause } };
  }
}

export function isCompatibleSchema(value: Record<string, unknown>): boolean {
  return value.schemaVersion === PERSISTENCE_SCHEMA_VERSION;
}

export function toPersistedSession(editorState: EditorState): PersistedEditorSession {
  return {
    schemaVersion: PERSISTENCE_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    selectedPresetId: editorState.selectedPreset?.id,
    customSize: editorState.customSize,
    cropState: editorState.cropState,
    processingSettings: editorState.processingSettings,
    exportSettings: editorState.exportSettings,
    validationIssueCount: editorState.validationIssues.length,
    hasAsset: Boolean(editorState.asset),
    assetMetadata: editorState.asset
      ? {
          id: editorState.asset.id,
          name: editorState.asset.name,
          type: editorState.asset.type,
          width: editorState.asset.metadata?.width,
          height: editorState.asset.metadata?.height,
          size: editorState.asset.size,
          lastModified: editorState.asset.lastModified,
        }
      : null,
  };
}

export function stripNonPersistableImages(_key: string, value: unknown): unknown {
  if (typeof File !== 'undefined' && value instanceof File) return undefined;
  if (typeof Blob !== 'undefined' && value instanceof Blob) return undefined;
  if (typeof ImageBitmap !== 'undefined' && value instanceof ImageBitmap) return undefined;
  if (typeof value === 'string' && value.startsWith('blob:')) return undefined;
  return value;
}

export function mergePreferences(
  base: PersistedPreferences,
  updates: Partial<PersistedPreferences>,
): PersistedPreferences {
  return {
    ...base,
    ...updates,
    persistence: {
      ...base.persistence,
      ...(updates.persistence ?? {}),
    },
    schemaVersion: PERSISTENCE_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
  };
}

export function preferencesFromEditorPreferences(preferences: LocalUserPreferences): PersistedPreferences {
  return {
    ...defaultPersistedPreferences(),
    theme: preferences.theme,
    updatedAt: preferences.updatedAt,
  };
}
