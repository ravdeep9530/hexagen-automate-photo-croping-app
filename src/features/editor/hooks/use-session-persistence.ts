import { useEffect, useCallback, useRef, useState } from 'react';
import type { EditorState } from '@/features/editor/store/editor-store';
import { createLocalSessionStore, type PersistedEditorSession } from '@/features/editor/persistence/local-session-store';
import { createPreferencesStore } from '@/features/editor/persistence/preferences-store';

type Listener = () => void;

interface SessionStore {
  session: PersistedEditorSession | null;
  hasSession: boolean;
  persistEnabled: boolean;
  isHydrating: boolean;
  error: string | null;
}

interface SessionActions {
  enablePersistence: () => Promise<void>;
  disablePersistence: () => Promise<void>;
  clearSession: () => Promise<void>;
  saveSession: (state: EditorState) => Promise<void>;
}

type SessionStoreWithActions = SessionStore & SessionActions;

const sessionStore = createLocalSessionStore();
const preferencesStore = createPreferencesStore();

class SessionStoreManager {
  private state: SessionStore = {
    session: null,
    hasSession: false,
    persistEnabled: false,
    isHydrating: false,
    error: null,
  };

  private listeners = new Set<Listener>();

  getState(): SessionStore {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    this.listeners.forEach(listener => listener());
  }

  private setState(partial: Partial<SessionStore>) {
    this.state = { ...this.state, ...partial };
    this.emit();
  }

  async hydrate(): Promise<void> {
    this.setState({ isHydrating: true, error: null });

    try {
      const [persistEnabledResult, sessionResult] = await Promise.all([
        preferencesStore.getPersistSessionEnabled(),
        sessionStore.loadSession(),
      ]);

      if (!persistEnabledResult.ok) {
        this.setState({
          persistEnabled: false,
          isHydrating: false,
          error: persistEnabledResult.error.message,
        });
        return;
      }

      const persistEnabled = persistEnabledResult.value;

      if (sessionResult.ok) {
        this.setState({
          session: sessionResult.value.session,
          hasSession: sessionResult.value.hasSession,
          persistEnabled,
          isHydrating: false,
          error: null,
        });
      } else {
        this.setState({
          session: null,
          hasSession: false,
          persistEnabled,
          isHydrating: false,
          error: sessionResult.error.message,
        });
      }
    } catch (err) {
      this.setState({
        isHydrating: false,
        error: err instanceof Error ? err.message : 'Unknown error during hydration',
      });
    }
  }

  async enablePersistence(): Promise<void> {
    const result = await preferencesStore.setPersistSessionEnabled(true);
    if (result.ok) {
      this.setState({ persistEnabled: true });
    } else {
      this.setState({ error: result.error.message });
    }
  }

  async disablePersistence(): Promise<void> {
    await sessionStore.clearSession();
    const result = await preferencesStore.setPersistSessionEnabled(false);
    if (result.ok) {
      this.setState({ persistEnabled: false, session: null, hasSession: false });
    } else {
      this.setState({ error: result.error.message });
    }
  }

  async clearSession(): Promise<void> {
    const result = await sessionStore.clearSession();
    if (result.ok) {
      this.setState({ session: null, hasSession: false });
    } else {
      this.setState({ error: result.error.message });
    }
  }

  async saveSession(state: EditorState): Promise<void> {
    if (!this.state.persistEnabled) {
      return;
    }

    const result = await sessionStore.saveSession(state);
    if (!result.ok) {
      this.setState({ error: result.error.message });
    }
  }
}

const storeManager = new SessionStoreManager();

export function useSessionPersistence(
  currentEditorState?: EditorState,
  saveDebounceMs: number = 500
): SessionStoreWithActions {
  const [, forceRender] = useState({});
  const stateRef = useRef(storeManager.getState());
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsubscribe = storeManager.subscribe(() => {
      stateRef.current = storeManager.getState();
      forceRender({});
    });

    if (!stateRef.current.isHydrating && !stateRef.current.session) {
      storeManager.hydrate();
    }

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!currentEditorState || !storeManager.getState().persistEnabled) {
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      storeManager.saveSession(currentEditorState);
    }, saveDebounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [currentEditorState, saveDebounceMs]);

  const enablePersistence = useCallback(async () => {
    await storeManager.enablePersistence();
  }, []);

  const disablePersistence = useCallback(async () => {
    await storeManager.disablePersistence();
  }, []);

  const clearSession = useCallback(async () => {
    await storeManager.clearSession();
  }, []);

  const saveSession = useCallback(async (state: EditorState) => {
    await storeManager.saveSession(state);
  }, []);

  return {
    ...stateRef.current,
    enablePersistence,
    disablePersistence,
    clearSession,
    saveSession,
  };
}

export function useSessionStore(): SessionStore {
  const [, forceRender] = useState({});
  const stateRef = useRef(storeManager.getState());

  useEffect(() => {
    const unsubscribe = storeManager.subscribe(() => {
      stateRef.current = storeManager.getState();
      forceRender({});
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return stateRef.current;
}

export function useSessionActions(): Pick<SessionStoreWithActions, 'enablePersistence' | 'disablePersistence' | 'clearSession' | 'saveSession'> {
  const [, forceRender] = useState({});
  const stateRef = useRef(storeManager.getState());

  useEffect(() => {
    const unsubscribe = storeManager.subscribe(() => {
      stateRef.current = storeManager.getState();
      forceRender({});
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const enablePersistence = useCallback(async () => {
    await storeManager.enablePersistence();
  }, []);

  const disablePersistence = useCallback(async () => {
    await storeManager.disablePersistence();
  }, []);

  const clearSession = useCallback(async () => {
    await storeManager.clearSession();
  }, []);

  const saveSession = useCallback(async (state: EditorState) => {
    await storeManager.saveSession(state);
  }, []);

  return {
    enablePersistence,
    disablePersistence,
    clearSession,
    saveSession,
  };
}
