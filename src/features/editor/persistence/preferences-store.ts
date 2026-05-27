import type { LocalUserPreferences } from '@/domain';
import {
  PREFERENCES_STORAGE_KEY,
  SESSION_STORAGE_KEY,
  PERSISTENCE_SCHEMA_VERSION,
  type PersistedPreferences,
  type PersistenceResult,
  type StorageAdapter,
  type ThemePreference,
  getLocalStorageAdapter,
  parseJsonObject,
  isCompatibleSchema,
  defaultPersistedPreferences,
  mergePreferences,
  classifyStorageError,
} from './storage-schema';

export interface PreferencesStoreOptions {
  storage?: StorageAdapter;
}

export interface LoadPreferencesResult {
  preferences: PersistedPreferences;
  isDefault: boolean;
}

export class PreferencesStore {
  private storage: StorageAdapter | null = null;

  constructor(opts?: PreferencesStoreOptions) {
    this.storage = opts?.storage ?? null;
  }

  private getStorage(): StorageAdapter | null {
    if (this.storage) return this.storage;
    const adapterResult = getLocalStorageAdapter();
    if (adapterResult.ok) {
      this.storage = adapterResult.value;
      return this.storage;
    }
    return null;
  }

  async savePreferences(preferences: PersistedPreferences): Promise<PersistenceResult<void>> {
    const storage = this.getStorage();
    if (!storage) {
      return { ok: false, error: { code: 'storage-unavailable', message: 'Storage adapter not available.' } };
    }

    try {
      const toSave: PersistedPreferences = {
        ...preferences,
        schemaVersion: PERSISTENCE_SCHEMA_VERSION,
        updatedAt: new Date().toISOString(),
      };
      storage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(toSave));
      return { ok: true, value: undefined };
    } catch (cause) {
      return { ok: false, error: { code: classifyStorageError(cause), message: 'Failed to save preferences.', cause } };
    }
  }

  async loadPreferences(): Promise<PersistenceResult<LoadPreferencesResult>> {
    const storage = this.getStorage();
    if (!storage) {
      return { ok: true, value: { preferences: defaultPersistedPreferences(), isDefault: true } };
    }

    try {
      const raw = await storage.getItem(PREFERENCES_STORAGE_KEY);
      if (!raw) return { ok: true, value: { preferences: defaultPersistedPreferences(), isDefault: true } };

      const parseResult = parseJsonObject(raw);
      if (!parseResult.ok) return { ok: true, value: { preferences: defaultPersistedPreferences(), isDefault: true } };

      if (!isCompatibleSchema(parseResult.value)) {
        return { ok: false, error: { code: 'schema-incompatible', message: `Preferences schema version incompatible (expected ${PERSISTENCE_SCHEMA_VERSION}).` } };
      }

      return { ok: true, value: { preferences: parseResult.value as unknown as PersistedPreferences, isDefault: false } };
    } catch {
      return { ok: true, value: { preferences: defaultPersistedPreferences(), isDefault: true } };
    }
  }

  async clearPreferences(): Promise<PersistenceResult<void>> {
    const storage = this.getStorage();
    if (!storage) {
      return { ok: false, error: { code: 'storage-unavailable', message: 'Storage adapter not available.' } };
    }

    try {
      storage.removeItem(PREFERENCES_STORAGE_KEY);
      return { ok: true, value: undefined };
    } catch (cause) {
      return { ok: false, error: { code: classifyStorageError(cause), message: 'Failed to clear preferences.', cause } };
    }
  }

  async updateTheme(theme: ThemePreference): Promise<PersistenceResult<void>> {
    const loadResult = await this.loadPreferences();
    const base = loadResult.ok ? loadResult.value.preferences : defaultPersistedPreferences();
    return this.savePreferences(mergePreferences(base, { theme }));
  }

  async updateLastPresetId(lastPresetId: string | undefined): Promise<PersistenceResult<void>> {
    const loadResult = await this.loadPreferences();
    const base = loadResult.ok ? loadResult.value.preferences : defaultPersistedPreferences();
    return this.savePreferences(mergePreferences(base, { lastPresetId }));
  }

  async setPersistSessionEnabled(enabled: boolean): Promise<PersistenceResult<void>> {
    const loadResult = await this.loadPreferences();
    const base = loadResult.ok ? loadResult.value.preferences : defaultPersistedPreferences();
    return this.savePreferences({ ...base, persistence: { ...base.persistence, persistSessionEnabled: enabled } });
  }

  async setPrivacyNoticeAcknowledged(acknowledged: boolean): Promise<PersistenceResult<void>> {
    const loadResult = await this.loadPreferences();
    const base = loadResult.ok ? loadResult.value.preferences : defaultPersistedPreferences();
    const now = new Date().toISOString();
    return this.savePreferences({
      ...base,
      persistence: {
        ...base.persistence,
        privacyNoticeAcknowledged: acknowledged,
        acknowledgedAt: acknowledged ? now : undefined,
      },
    });
  }

  async getPersistSessionEnabled(): Promise<PersistenceResult<boolean>> {
    const loadResult = await this.loadPreferences();
    if (!loadResult.ok) return { ok: true, value: false };
    return { ok: true, value: loadResult.value.preferences.persistence?.persistSessionEnabled ?? false };
  }

  async getPrivacyNoticeAcknowledged(): Promise<PersistenceResult<boolean>> {
    const loadResult = await this.loadPreferences();
    if (!loadResult.ok) return { ok: true, value: false };
    return { ok: true, value: loadResult.value.preferences.persistence?.privacyNoticeAcknowledged ?? false };
  }

  async clearAllLocalData(): Promise<PersistenceResult<void>> {
    const storage = this.getStorage();
    if (!storage) return { ok: false, error: { code: 'storage-unavailable', message: 'Storage adapter not available.' } };

    try {
      storage.removeItem(PREFERENCES_STORAGE_KEY);
      storage.removeItem(SESSION_STORAGE_KEY);
      return { ok: true, value: undefined };
    } catch (cause) {
      return { ok: false, error: { code: classifyStorageError(cause), message: 'Failed to clear local data.', cause } };
    }
  }
}

export function createPreferencesStore(opts?: PreferencesStoreOptions): PreferencesStore {
  return new PreferencesStore(opts);
}

export function persistedPreferencesToLocalUserPreferences(persisted: PersistedPreferences): Partial<LocalUserPreferences> {
  return { theme: persisted.theme, updatedAt: persisted.updatedAt };
}
