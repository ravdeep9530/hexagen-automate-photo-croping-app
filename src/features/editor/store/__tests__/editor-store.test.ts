import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';

import {
  useEditorStore,
  createDefaultState,
  createDefaultProcessingSettings,
  createDefaultRuntimeState,
  hasUnsavedChanges,
  canExport,
  exportEditorStateToSession,
  type CustomSize,
} from '../editor-store';

import {
  selectPreset,
  setCustomSize,
  setAsset,
  updateCrop,
  updateProcessingPartial,
  updateExportPartial,
  setValidationIssues,
  resetEditor,
} from '../actions';

import type { PhotoPreset, ImageAsset, ImageMetadata, ValidationIssue } from '@/domain';

const createMockPreset = (overrides: Partial<PhotoPreset> = {}): PhotoPreset => ({
  id: 'test-preset-1',
  name: 'Test Passport',
  description: 'Test passport preset',
  country: 'US',
  documentType: 'passport',
  dimensions: {
    widthMm: 51,
    heightMm: 51,
    widthPx: 600,
    heightPx: 600,
    minDpi: 300,
  },
  fileConstraints: {
    maxFileSizeMb: 10,
    acceptedFormats: ['image/jpeg', 'image/png'],
  },
  source: {
    country: 'US',
    authority: 'Test Authority',
    url: 'https://example.com',
    lastReviewed: new Date().toISOString(),
    documentType: 'passport',
  },
  isActive: true,
  tags: ['test'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const createMockAsset = (overrides: Partial<ImageAsset> = {}): ImageAsset => ({
  id: 'test-asset-1',
  name: 'test-photo.jpg',
  metadata: {
    width: 1200,
    height: 1600,
    aspectRatio: 0.75,
    format: 'jpeg',
    colorMode: 'rgb',
    hasAlpha: false,
    fileSizeBytes: 1024000,
  } as ImageMetadata,
  status: 'valid',
  uploadedAt: new Date().toISOString(),
  ...overrides,
});

const createMockValidationIssue = (overrides: Partial<ValidationIssue> = {}): ValidationIssue => ({
  ruleId: 'test-rule',
  type: 'dimension',
  severity: 'error',
  message: 'Test error message',
  checkedAt: new Date().toISOString(),
  ...overrides,
});

describe('Editor Store', () => {
  beforeEach(() => {
    useEditorStore.setState(createDefaultState(), true);
  });

  it('initializes with default factories', () => {
    const state = useEditorStore.getState();

    expect(state.selectedPreset).toBeNull();
    expect(state.customSize).toBeNull();
    expect(state.asset).toBeNull();
    expect(state.cropState).toBeNull();
    expect(state.faceAnalysis).toBeNull();
    expect(state.validationIssues).toEqual([]);
    expect(state.processingSettings).toEqual(createDefaultProcessingSettings());
    expect(state.runtime).toEqual(createDefaultRuntimeState());
    expect(state.preferences.version).toBe('1.0.0');
  });

  it('selects presets, updates aspect ratio and preserves safe export settings', () => {
    const preset1 = createMockPreset({ id: 'preset-1' });
    const preset2 = createMockPreset({
      id: 'preset-2',
      dimensions: { widthMm: 35, heightMm: 45, widthPx: 413, heightPx: 531, minDpi: 300 },
    });

    act(() => {
      useEditorStore.getState().selectPreset(preset1);
      useEditorStore.getState().updateExportPartial({ quality: 0.88, filename: 'my-photo' });
      useEditorStore.getState().selectPreset(preset2);
    });

    const state = useEditorStore.getState();
    expect(state.selectedPreset?.id).toBe('preset-2');
    expect(state.customSize).toBeNull();
    expect(state.cropState?.aspectRatio).toBeCloseTo(35 / 45);
    expect(state.exportSettings?.widthPx).toBe(413);
    expect(state.exportSettings?.heightPx).toBe(531);
    expect(state.exportSettings?.quality).toBe(0.88);
    expect(state.exportSettings?.filename).toBe('my-photo');
  });

  it('configures custom size and export dimensions', () => {
    const customSize: CustomSize = { widthMm: 35, heightMm: 45, dpi: 300 };

    act(() => {
      useEditorStore.getState().selectPreset(createMockPreset());
      useEditorStore.getState().setCustomSize(customSize);
    });

    const state = useEditorStore.getState();
    expect(state.selectedPreset).toBeNull();
    expect(state.customSize).toEqual(customSize);
    expect(state.cropState?.aspectRatio).toBeCloseTo(35 / 45);
    expect(state.exportSettings?.widthPx).toBe(Math.round((35 / 25.4) * 300));
    expect(state.exportSettings?.heightPx).toBe(Math.round((45 / 25.4) * 300));
  });

  it('sets, replaces and clears assets without requiring persisted image objects', () => {
    const asset = createMockAsset();
    const replacement = createMockAsset({ id: 'asset-2', name: 'replacement.jpg' });

    act(() => {
      useEditorStore.getState().setAsset(asset);
    });

    expect(useEditorStore.getState().asset).toEqual(asset);
    expect(useEditorStore.getState().cropState?.width).toBe(1200);

    act(() => {
      useEditorStore.getState().replaceAsset(replacement);
    });

    expect(useEditorStore.getState().asset?.id).toBe('asset-2');

    act(() => {
      useEditorStore.getState().clearAsset();
    });

    const state = useEditorStore.getState();
    expect(state.asset).toBeNull();
    expect(state.cropState).toBeNull();
    expect(state.faceAnalysis).toBeNull();
    expect(state.processingSettings).toEqual(createDefaultProcessingSettings());
  });

  it('updates crop, processing, export and validation state', () => {
    act(() => {
      useEditorStore.getState().selectPreset(createMockPreset());
      useEditorStore.getState().updateCrop({
        x: 10,
        y: 20,
        width: 300,
        height: 300,
        rotation: 0,
        scale: 1,
        flipHorizontal: false,
        flipVertical: false,
        aspectRatio: 1,
      });
      useEditorStore.getState().updateCropPartial({ rotation: 45, scale: 1.5 });
      useEditorStore.getState().updateProcessingPartial({ brightness: 0.4 });
      useEditorStore.getState().updateBackground({ mode: 'replace', color: '#FFFFFF' });
      useEditorStore.getState().updateExportPartial({ quality: 0.7 });
      useEditorStore.getState().setValidationIssues([createMockValidationIssue()]);
    });

    const state = useEditorStore.getState();
    expect(state.cropState?.rotation).toBe(45);
    expect(state.cropState?.scale).toBe(1.5);
    expect(state.processingSettings.brightness).toBe(0.4);
    expect(state.processingSettings.background).toEqual({ mode: 'replace', color: '#FFFFFF' });
    expect(state.exportSettings?.quality).toBe(0.7);
    expect(state.validationIssues).toHaveLength(1);
  });

  it('manages runtime progress and abort controllers outside persisted session state', () => {
    const processingController = new AbortController();
    const exportController = new AbortController();

    act(() => {
      useEditorStore.getState().setIsProcessing(true);
      useEditorStore.getState().setProcessingProgress(1.5);
      useEditorStore.getState().setExportProgress(-1);
      useEditorStore.getState().setProcessingAbortController(processingController);
      useEditorStore.getState().setExportAbortController(exportController);
    });

    const state = useEditorStore.getState();
    expect(state.runtime.isProcessing).toBe(true);
    expect(state.runtime.processingProgress).toBe(1);
    expect(state.runtime.exportProgress).toBe(0);
    expect(state.runtime.processingAbortController).toBe(processingController);
    expect(state.runtime.exportAbortController).toBe(exportController);

    const session = exportEditorStateToSession(state);
    expect(JSON.stringify(session)).not.toContain('AbortController');
    expect(session).not.toHaveProperty('asset');
  });

  it('resets editor to defaults while preserving preferences', () => {
    const asset = createMockAsset();

    act(() => {
      useEditorStore.getState().setPreferences({
        ...useEditorStore.getState().preferences,
        theme: 'dark',
      });
      useEditorStore.getState().selectPreset(createMockPreset());
      useEditorStore.getState().setAsset(asset);
      useEditorStore.getState().updateProcessingPartial({ brightness: 0.9 });
      useEditorStore.getState().resetEditor();
    });

    const state = useEditorStore.getState();
    expect(state.selectedPreset).toBeNull();
    expect(state.asset).toBeNull();
    expect(state.cropState).toBeNull();
    expect(state.processingSettings.brightness).toBe(0);
    expect(state.preferences.theme).toBe('dark');
  });

  it('supports direct exported actions and export readiness helpers', () => {
    const preset = createMockPreset();
    const asset = createMockAsset();

    act(() => {
      selectPreset(preset);
      setCustomSize({ widthMm: 35, heightMm: 45, dpi: 300 });
      setAsset(asset);
      updateCrop({
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
        scale: 1,
        flipHorizontal: false,
        flipVertical: false,
      });
      updateProcessingPartial({ contrast: 0.2 });
      updateExportPartial({ quality: 0.8 });
    });

    expect(hasUnsavedChanges(useEditorStore.getState())).toBe(true);
    expect(canExport(useEditorStore.getState())).toBe(true);
    expect(useEditorStore.getState().processingSettings.contrast).toBe(0.2);
    expect(useEditorStore.getState().exportSettings?.quality).toBe(0.8);

    act(() => {
      setValidationIssues([createMockValidationIssue({ severity: 'error' })]);
    });

    expect(canExport(useEditorStore.getState())).toBe(false);

    act(() => resetEditor());
    expect(useEditorStore.getState().asset).toBeNull();
  });
});
