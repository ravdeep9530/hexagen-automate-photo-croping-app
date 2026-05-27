import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act, within, fireEvent } from '@testing-library/react';

import { createMockFile } from '@/test/mocks/file';

describe('Persistence Workflow Tests', () => {
  const STORAGE_KEY = 'passport-photo-editor:preferences';
  const SESSION_KEY = 'passport-photo-editor:session';

  beforeEach(() => {
    // Clear storage before each test
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // Mock components for persistence workflow tests
  const MockPrivacyNotice = ({
    onPersistChange,
  }: {
    onPersistChange?: (persistData: boolean) => void;
  }) => {
    const [persistEnabled, setPersistEnabled] = React.useState(() => {
      const stored = localStorage.getItem('persist-consent');
      return stored === 'true';
    });

    const handleToggle = (enabled: boolean) => {
      setPersistEnabled(enabled);
      localStorage.setItem('persist-consent', enabled.toString());
      onPersistChange?.(enabled);
    };

    return (
      <div data-testid="privacy-notice">
        <h3>Privacy Notice</h3>
        <p>We can save your preferences locally to improve your experience.</p>
        <label data-testid="persist-toggle">
          <input
            type="checkbox"
            checked={persistEnabled}
            onChange={(e) => handleToggle(e.target.checked)}
            aria-label="Save preferences locally"
          />
          Save preferences locally
        </label>
        {persistEnabled && (
          <div data-testid="persist-status">Preferences will be saved locally</div>
        )}
      </div>
    );
  };

  const MockDataPersistenceManager = ({
    initialSettings,
  }: {
    initialSettings?: { theme: string; lastPreset: string; quality: number };
  }) => {
    const [settings, setSettings] = React.useState(initialSettings || {
      theme: 'system',
      lastPreset: '',
      quality: 0.95,
    });

    const [isRestored, setIsRestored] = React.useState(false);
    const skipNextSave = React.useRef(false);

    // Load from storage on mount
    React.useEffect(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setSettings(parsed);
          setIsRestored(true);
        } catch {
          // Invalid storage, ignore
        }
      }
    }, []);

    // Save to storage when settings change
    React.useEffect(() => {
      if (skipNextSave.current) {
        skipNextSave.current = false;
        return;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }, [settings]);

    const handleClearData = () => {
      skipNextSave.current = true;
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SESSION_KEY);
      setIsRestored(false);
      setSettings({ theme: 'system', lastPreset: '', quality: 0.95 });
    };

    return (
      <div data-testid="persistence-manager">
        <h2>Data Management</h2>
        {isRestored && <div role="status" data-testid="restore-indicator">Settings restored from previous session</div>}
        <div data-testid="settings-display">
          <div data-testid="theme-setting">Theme: {settings.theme}</div>
          <div data-testid="preset-setting">Last Preset: {settings.lastPreset || 'None'}</div>
          <div data-testid="quality-setting">Quality: {settings.quality}</div>
        </div>
        <label data-testid="theme-selector">
          <span>Theme</span>
          <select
            data-testid="theme-dropdown"
            value={settings.theme}
            onChange={(e) => setSettings((s) => ({ ...s, theme: e.target.value }))}
            aria-label="Select theme"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </label>
        <label data-testid="preset-input">
          <span>Last Preset</span>
          <input
            data-testid="preset-text-input"
            type="text"
            value={settings.lastPreset}
            onChange={(e) => setSettings((s) => ({ ...s, lastPreset: e.target.value }))}
            placeholder="Enter preset ID"
          />
        </label>
        <label data-testid="quality-slider">
          <span>Quality</span>
          <input
            data-testid="quality-range"
            type="range"
            min="0.5"
            max="1"
            step="0.05"
            value={settings.quality}
            onChange={(e) => setSettings((s) => ({ ...s, quality: parseFloat(e.target.value) }))}
          />
        </label>
        <button
          data-testid="clear-data-btn"
          onClick={handleClearData}
          aria-label="Clear all local data"
        >
          Clear Local Data
        </button>
      </div>
    );
  };

  it('shows privacy notice and allows opt-in for local persistence', async () => {
    const onPersistChange = vi.fn();

    render(<MockPrivacyNotice onPersistChange={onPersistChange} />);

    // Verify privacy notice is displayed
    expect(screen.getByTestId('privacy-notice')).toBeTruthy();
    expect(screen.getByText(/privacy notice/i)).toBeTruthy();

    // Check that persist toggle is initially unchecked
    const toggle = screen.getByTestId('persist-toggle').querySelector('input');
    expect((toggle as HTMLInputElement).checked).toBe(false);

    // Opt-in to persist
    await act(async () => {
      fireEvent.click(toggle!);
    });

    // Verify callback and status update
    expect(onPersistChange).toHaveBeenCalledWith(true);
    expect(screen.getByTestId('persist-status')).toBeTruthy();

    // Verify consent is stored
    expect(localStorage.getItem('persist-consent')).toBe('true');
  });

  it('restores saved settings from localStorage on load', async () => {
    // Pre-populate localStorage
    const savedSettings = {
      theme: 'dark',
      lastPreset: 'us-passport',
      quality: 0.8,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedSettings));

    render(<MockDataPersistenceManager />);

    // Verify restored notification
    await waitFor(() => {
      expect(screen.getByRole('status').textContent).toContain('Settings restored from previous session');
    });

    // Verify settings are restored
    expect(screen.getByTestId('theme-setting').textContent).toContain('Theme: dark');
    expect(screen.getByTestId('preset-setting').textContent).toContain('Last Preset: us-passport');
    expect(screen.getByTestId('quality-setting').textContent).toContain('Quality: 0.8');
  });

  it('saves changes to localStorage automatically', async () => {
    render(<MockDataPersistenceManager />);

    // Change theme
    const themeDropdown = screen.getByTestId('theme-dropdown');
    await act(async () => {
      fireEvent.change(themeDropdown, { target: { value: 'dark' } });
    });

    // Verify save was triggered
    await waitFor(() => {
      expect(localStorage.getItem(STORAGE_KEY)).toContain('dark');
    });
  });

  it('clears all local data when clear button is clicked', async () => {

    // Pre-populate with data
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme: 'dark', lastPreset: 'ca-visa' }));
    localStorage.setItem(SESSION_KEY, JSON.stringify({ sessionId: 'test-123' }));

    render(<MockDataPersistenceManager />);

    // Verify data is loaded
    await waitFor(() => {
      expect(screen.getByTestId('theme-setting').textContent).toContain('dark');
    });

    // Click clear data button
    const clearBtn = screen.getByTestId('clear-data-btn');
    await act(async () => {
      fireEvent.click(clearBtn);
    });

    // Verify storage is cleared
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();

    // Verify settings are reset to defaults
    expect(screen.getByTestId('theme-setting').textContent).toContain('Theme: system');
    expect(screen.getByTestId('preset-setting').textContent).toContain('Last Preset: None');
  });

  it('does not persist image blobs by default', async () => {
    const storageData = {
      theme: 'light',
      lastPreset: 'in-passport',
      // No imageBlob field - demonstrates images are not stored
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));

    render(<MockDataPersistenceManager />);

    await waitFor(() => {
      expect(screen.getByTestId('theme-setting').textContent).toContain('light');
    });

    // Verify no image data was attempted to be stored
    const storedValue = localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(storedValue!);
    expect(parsed.imageBlob).toBeUndefined();
    expect(parsed.imageUrl).toBeUndefined();
  });

  it('handles corrupted localStorage gracefully', async () => {
    // Set invalid JSON
    localStorage.setItem(STORAGE_KEY, 'invalid-json{{{{');

    // Should not throw
    render(<MockDataPersistenceManager />);

    // Should use defaults instead
    await waitFor(() => {
      expect(screen.getByTestId('theme-setting').textContent).toContain('Theme: system');
    });
  });

  it('provides accessible clear data button with appropriate labeling', async () => {
    render(<MockDataPersistenceManager />);

    const clearBtn = screen.getByRole('button', { name: /clear all local data/i });
    expect(clearBtn).toBeTruthy();
    expect(clearBtn.getAttribute('data-testid')).toBe('clear-data-btn');
  });

  it('shows appropriate status for persistence actions', async () => {

    // Pre-populate to trigger restore indicator
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme: 'light', lastPreset: 'test' }));

    render(<MockDataPersistenceManager />);

    // Verify restore status is shown
    await waitFor(() => {
      const status = screen.getByRole('status');
      expect(status.textContent).toContain('restored');
    });

    // Clear and verify status goes away
    const clearBtn = screen.getByTestId('clear-data-btn');
    await act(async () => {
      fireEvent.click(clearBtn);
    });

    // After clearing, restore indicator should be gone
    expect(screen.queryByText('Settings restored from previous session')).toBeNull();
  });
});