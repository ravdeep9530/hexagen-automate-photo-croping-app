import type { EditorState } from '@/features/editor/store/editor-store';
import {
  SESSION_STORAGE_KEY,
  PERSISTENCE_SCHEMA_VERSION,
  type PersistedEditorSession,
  type PersistenceResult,
  type StorageAdapter,
  getLocalStorageAdapter,
  parseJsonObject,
  isCompatibleSchema,
  toPersistedSession,
  defaultPersistedPreferences,
  mergePreferences,
  PREFERENCES_STORAGE_KEY,
  type PersistedPreferences,
  stripNonPersistableImages,
  classifyStorageError,
} from './storage-schema';

export interface LocalSessionStoreOptions {
  storage?: StorageAdapter;
}

export interface LoadSessionResult {
  session: PersistedEditorSession | null;
  hasSession: boolean;
}

export class LocalSessionStore {
  private storage: StorageAdapter | null = null;

  constructor(opts?: LocalSessionStoreOptions) {
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

  async saveSession(editorState: EditorState): Promise<PersistenceResult<void>> {
    const persistingPreference = await this.getPersistSessionEnabled();
    if (!persistingPreference.ok) return persistingPreference;
    if (!persistingPreference.value) return { ok: true, value: undefined };

    const storage = this.getStorage();
    if (!storage) return { ok: false, error: { code: 'storage-unavailable', message: 'Storage adapter not available.' } };

    try {
      storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(toPersistedSession(editorState), stripNonPersistableImages));
      return { ok: true, value: undefined };
    } catch (cause) {
      return { ok: false, error: { code: classifyStorageError(cause), message: 'Failed to save session.', cause } };
    }
  }

  async loadSession(): Promise<PersistenceResult<LoadSessionResult>> {
    const storage = this.getStorage();
    if (!storage) return { ok: false, error: { code: 'storage-unavailable', message: 'Storage adapter not available.' } };

    try {
      const raw = await storage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return { ok: true, value: { session: null, hasSession: false } };

      const parseResult = parseJsonObject(raw);
      if (!parseResult.ok) return parseResult;
      if (!isCompatibleSchema(parseResult.value)) {
        return { ok: false, error: { code: 'schema-incompatible', message: `Session schema version incompatible (expected ${PERSISTENCE_SCHEMA_VERSION}).` } };
      }

      const session = parseResult.value as unknown as PersistedEditorSession;
      if (session.hasAsset) {
        return { ok: true, value: { session: { ...session, hasAsset: false, assetMetadata: null }, hasSession: true } };
      }
      return { ok: true, value: { session, hasSession: true } };
    } catch (cause) {
      return { ok: false, error: { code: classifyStorageError(cause), message: 'Failed to load session.', cause } };
    }
  }

  async clearSession(): Promise<PersistenceResult<void>> {
    const storage = this.getStorage();
    if (!storage) return { ok: false, error: { code: 'storage-unavailable', message: 'Storage adapter not available.' } };

    try {
      storage.removeItem(SESSION_STORAGE_KEY);
      return { ok: true, value: undefined };
    } catch (cause) {
      return { ok: false, error: { code: classifyStorageError(cause), message: 'Failed to clear session.', cause } };
    }
  }

  async getPersistSessionEnabled(): Promise<PersistenceResult<boolean>> {
    const storage = this.getStorage();
    if (!storage) return { ok: false, error: { code: 'storage-unavailable', message: 'Storage adapter not available.' } };

    try {
      const raw = await storage.getItem(PREFERENCES_STORAGE_KEY);
      if (!raw) return { ok: true, value: defaultPersistedPreferences().persistence.persistSessionEnabled };
      const parseResult = parseJsonObject(raw);
      if (!parseResult.ok || !isCompatibleSchema(parseResult.value)) return { ok: true, value: false };
      return { ok: true, value: (parseResult.value as unknown as PersistedPreferences).persistence?.persistSessionEnabled ?? false };
    } catch (cause) {
      return { ok: false, error: { code: classifyStorageError(cause), message: 'Failed to read persist setting.', cause } };
    }
  }

  async setPersistSessionEnabled(enabled: boolean): Promise<PersistenceResult<void>> {
    const storage = this.getStorage();
    if (!storage) return { ok: false, error: { code: 'storage-unavailable', message: 'Storage adapter not available.' } };

    try {
      const raw = await storage.getItem(PREFERENCES_STORAGE_KEY);
      let base: PersistedPreferences = defaultPersistedPreferences();
      if (raw) {
        const parseResult = parseJsonObject(raw);
        if (parseResult.ok && isCompatibleSchema(parseResult.value)) base = mergePreferences(base, parseResult.value as unknown as PersistedPreferences);
      }
      storage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({ ...base, persistence: { ...base.persistence, persistSessionEnabled: enabled }, updatedAt: new Date().toISOString() }, stripNonPersistableImages));
      return { ok: true, value: undefined };
    } catch (cause) {
      return { ok: false, error: { code: classifyStorageError(cause), message: 'Failed to update persist setting.', cause } };
    }
  }

  async setPrivacyNoticeAcknowledged(acknowledged: boolean): Promise<PersistenceResult<void>> {
    const storage = this.getStorage();
    if (!storage) return { ok: false, error: { code: 'storage-unavailable', message: 'Storage adapter not available.' } };

    try {
      const raw = await storage.getItem(PREFERENCES_STORAGE_KEY);
      let base: PersistedPreferences = defaultPersistedPreferences();
      if (raw) {
        const parseResult = parseJsonObject(raw);
        if (parseResult.ok && isCompatibleSchema(parseResult.value)) base = mergePreferences(base, parseResult.value as unknown as PersistedPreferences);
      }
      const now = new Date().toISOString();
      storage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({ ...base, persistence: { ...base.persistence, privacyNoticeAcknowledged: acknowledged, acknowledgedAt: acknowledged ? now : undefined }, updatedAt: now }, stripNonPersistableImages));
      return { ok: true, value: undefined };
    } catch (cause) {
      return { ok: false, error: { code: classifyStorageError(cause), message: 'Failed to update privacy notice acknowledgment.', cause } };
    }
  }
}

export function createLocalSessionStore(opts?: LocalSessionStoreOptions): LocalSessionStore {
  return new LocalSessionStore(opts);
}
