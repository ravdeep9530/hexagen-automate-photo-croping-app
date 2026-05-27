import { describe, expect, it, beforeEach } from 'vitest';

import { createDefaultState, type EditorState } from '@/features/editor/store/editor-store';
import { LocalSessionStore } from '@/features/editor/persistence/local-session-store';
import { PreferencesStore } from '@/features/editor/persistence/preferences-store';
import {
  PREFERENCES_STORAGE_KEY,
  SESSION_STORAGE_KEY,
  PERSISTENCE_SCHEMA_VERSION,
  defaultPersistedPreferences,
  type StorageAdapter,
} from '@/features/editor/persistence/storage-schema';

class MemoryStorage implements StorageAdapter {
  values = new Map<string, string>();
  throwOnSet = false;

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.throwOnSet) {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    }
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

function editorState(overrides: Partial<EditorState> = {}): EditorState {
  return {
    ...createDefaultState(),
    cropState: {
      x: 10,
      y: 20,
      width: 300,
      height: 400,
      rotation: 0,
      scale: 1,
      flipHorizontal: false,
      flipVertical: false,
    },
    processingSettings: {
      brightness: 0.1,
      contrast: 0,
      saturation: 0,
      sharpness: 0,
      background: { mode: 'original' },
      skinSmoothing: 0,
      redEyeReduction: false,
      autoEnhance: false,
      grayscale: false,
    },
    ...overrides,
  };
}

function persistedPreferences(persistSessionEnabled: boolean) {
  return {
    ...defaultPersistedPreferences(),
    persistence: {
      ...defaultPersistedPreferences().persistence,
      persistSessionEnabled,
      privacyNoticeAcknowledged: true,
    },
  };
}

describe('LocalSessionStore', () => {
  let storage: MemoryStorage;
  let sessionStore: LocalSessionStore;
  let preferencesStore: PreferencesStore;

  beforeEach(() => {
    storage = new MemoryStorage();
    sessionStore = new LocalSessionStore({ storage });
    preferencesStore = new PreferencesStore({ storage });
  });

  it('saves, restores, and clears preferences', async () => {
    const preferences = persistedPreferences(true);

    await expect(preferencesStore.savePreferences(preferences)).resolves.toMatchObject({ ok: true });

    const loaded = await preferencesStore.loadPreferences();
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.value.preferences.persistence.persistSessionEnabled).toBe(true);
      expect(loaded.value.preferences.persistence.privacyNoticeAcknowledged).toBe(true);
    }

    await expect(preferencesStore.clearPreferences()).resolves.toMatchObject({ ok: true });
    expect(storage.getItem(PREFERENCES_STORAGE_KEY)).toBeNull();
  });

  it('does not save editor session metadata until persistence is opted in', async () => {
    await sessionStore.saveSession(editorState());
    expect(storage.getItem(SESSION_STORAGE_KEY)).toBeNull();

    await preferencesStore.savePreferences(persistedPreferences(true));
    await sessionStore.saveSession(editorState());

    expect(storage.getItem(SESSION_STORAGE_KEY)).not.toBeNull();
  });

  it('restores a compatible lightweight session and clears it', async () => {
    await preferencesStore.savePreferences(persistedPreferences(true));
    await sessionStore.saveSession(editorState());

    const restored = await sessionStore.loadSession();
    expect(restored.ok).toBe(true);
    if (restored.ok) {
      expect(restored.value.hasSession).toBe(true);
      expect(restored.value.session?.schemaVersion).toBe(PERSISTENCE_SCHEMA_VERSION);
      expect(restored.value.session?.cropState?.width).toBe(300);
    }

    await expect(sessionStore.clearSession()).resolves.toMatchObject({ ok: true });
    const afterClear = await sessionStore.loadSession();
    expect(afterClear.ok).toBe(true);
    if (afterClear.ok) expect(afterClear.value.hasSession).toBe(false);
  });

  it('rejects incompatible serialized sessions and falls back to no restored session', async () => {
    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ schemaVersion: 999, cropState: { width: 1 } }));

    const restored = await sessionStore.loadSession();

    expect(restored.ok).toBe(false);
    if (!restored.ok) expect(restored.error.code).toBe('schema-incompatible');
  });

  it('does not persist image blobs, File objects, ImageBitmap objects, or object URLs', async () => {
    await preferencesStore.savePreferences(persistedPreferences(true));

    const file = new File(['image'], 'passport.jpg', { type: 'image/jpeg' });
    const state = editorState({
      asset: {
        id: 'asset-1',
        name: 'passport.jpg',
        file,
        blobUrl: 'blob:https://example.test/private-image',
        metadata: {
          width: 800,
          height: 1000,
          aspectRatio: 0.8,
          format: 'jpeg',
          colorMode: 'rgb',
          hasAlpha: false,
          fileSizeBytes: file.size,
        },
        status: 'valid',
        uploadedAt: new Date().toISOString(),
      },
      runtime: {
        ...createDefaultState().runtime,
        originalFile: file,
        imageObjectUrl: 'blob:https://example.test/runtime-image',
      },
    });

    await sessionStore.saveSession(state);

    const raw = storage.getItem(SESSION_STORAGE_KEY);
    expect(raw).toBeTruthy();
    expect(raw).not.toContain('blob:');
    expect(raw).not.toContain('private-image');
    expect(raw).not.toContain('runtime-image');
    expect(raw).not.toContain('image/jpeg');
  });

  it('returns a structured quota exceeded result', async () => {
    await preferencesStore.savePreferences(persistedPreferences(true));
    storage.throwOnSet = true;

    const result = await sessionStore.saveSession(editorState());

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('quota-exceeded');
  });
});
