'use client';

import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { usePreviewRender } from '../hooks/use-preview-render';
import { useEditorStore } from '../store/editor-store';

interface ProcessingControlsProps {
  className?: string;
  disabled?: boolean;
}

export const PROCESSING_LIMITS = {
  adjustment: { min: -1, max: 1, step: 0.01 },
  blur: { min: 0, max: 24, step: 1 },
};

const BACKGROUND_OPTIONS = [
  { mode: 'original' as const, label: 'Original' },
  { mode: 'remove' as const, label: 'Remove' },
  { mode: 'replace' as const, label: 'Color' },
  { mode: 'blur' as const, label: 'Blur' },
] as const;

const COLOR_PRESETS = [
  { color: '#FFFFFF', label: 'White' },
  { color: '#3B82F6', label: 'Blue' },
  { color: '#EF4444', label: 'Red' },
  { color: '#22C55E', label: 'Green' },
  { color: '#6B7280', label: 'Gray' },
  { color: '#000000', label: 'Black' },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const numberFromInput = (value: string, fallback: number) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};
const normalizeHexColor = (value: string) => {
  const normalized = value.toUpperCase();
  return /^#[0-9A-F]{6}$/.test(normalized) ? normalized : null;
};
const formatAdjustmentValue = (value: number) => {
  const percentage = Math.round(value * 100);
  return percentage > 0 ? `+${percentage}%` : `${percentage}%`;
};

export function ProcessingControls({ className, disabled = false }: ProcessingControlsProps): React.JSX.Element {
  const processingSettings = useEditorStore((state) => state.processingSettings);
  const updateProcessingPartial = useEditorStore((state) => state.updateProcessingPartial);
  const updateBackground = useEditorStore((state) => state.updateBackground);
  const { refreshPreview } = usePreviewRender();
  const [pendingRefresh, setPendingRefresh] = useState(false);

  const markPreviewDirty = () => {
    setPendingRefresh(true);
    refreshPreview();
    window.setTimeout(() => setPendingRefresh(false), 150);
  };

  const updateAdjustment = (key: 'brightness' | 'contrast' | 'saturation', rawValue: string) => {
    const value = clamp(
      numberFromInput(rawValue, processingSettings[key]),
      PROCESSING_LIMITS.adjustment.min,
      PROCESSING_LIMITS.adjustment.max,
    );
    updateProcessingPartial({ [key]: value });
    markPreviewDirty();
  };

  const handleBackgroundModeChange = (mode: typeof BACKGROUND_OPTIONS[number]['mode']) => {
    updateBackground({ ...processingSettings.background, mode });
    markPreviewDirty();
  };

  const handleBackgroundColorChange = (color: string) => {
    const normalized = normalizeHexColor(color);
    if (!normalized) return;
    updateBackground({ ...processingSettings.background, mode: 'replace', color: normalized });
    markPreviewDirty();
  };

  const handleBlurChange = (rawValue: string) => {
    const blurAmount = clamp(
      numberFromInput(rawValue, processingSettings.background.blurAmount ?? 0),
      PROCESSING_LIMITS.blur.min,
      PROCESSING_LIMITS.blur.max,
    );
    updateBackground({ ...processingSettings.background, mode: 'blur', blurAmount });
    markPreviewDirty();
  };

  const handleManualRefresh = () => {
    setPendingRefresh(true);
    refreshPreview();
    window.setTimeout(() => setPendingRefresh(false), 150);
  };

  const showColorPicker = processingSettings.background.mode === 'replace';
  const showBlurControl = processingSettings.background.mode === 'blur';
  const customColor = processingSettings.background.color ?? '#FFFFFF';

  return (
    <section className={cn('space-y-6', className)} aria-label="Processing controls">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="brightness-slider" className="text-sm font-medium">Brightness</label>
          <output htmlFor="brightness-slider" aria-live="polite" className="text-xs text-muted-foreground">
            {formatAdjustmentValue(processingSettings.brightness)}
          </output>
        </div>
        <input
          id="brightness-slider"
          aria-label="Brightness adjustment"
          className="w-full accent-primary"
          type="range"
          min={PROCESSING_LIMITS.adjustment.min}
          max={PROCESSING_LIMITS.adjustment.max}
          step={PROCESSING_LIMITS.adjustment.step}
          value={processingSettings.brightness}
          disabled={disabled}
          onChange={(event) => updateAdjustment('brightness', event.currentTarget.value)}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="contrast-slider" className="text-sm font-medium">Contrast</label>
          <output htmlFor="contrast-slider" aria-live="polite" className="text-xs text-muted-foreground">
            {formatAdjustmentValue(processingSettings.contrast)}
          </output>
        </div>
        <input
          id="contrast-slider"
          aria-label="Contrast adjustment"
          className="w-full accent-primary"
          type="range"
          min={PROCESSING_LIMITS.adjustment.min}
          max={PROCESSING_LIMITS.adjustment.max}
          step={PROCESSING_LIMITS.adjustment.step}
          value={processingSettings.contrast}
          disabled={disabled}
          onChange={(event) => updateAdjustment('contrast', event.currentTarget.value)}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="saturation-slider" className="text-sm font-medium">Saturation</label>
          <output htmlFor="saturation-slider" aria-live="polite" className="text-xs text-muted-foreground">
            {formatAdjustmentValue(processingSettings.saturation)}
          </output>
        </div>
        <input
          id="saturation-slider"
          aria-label="Saturation adjustment"
          className="w-full accent-primary"
          type="range"
          min={PROCESSING_LIMITS.adjustment.min}
          max={PROCESSING_LIMITS.adjustment.max}
          step={PROCESSING_LIMITS.adjustment.step}
          value={processingSettings.saturation}
          disabled={disabled}
          onChange={(event) => updateAdjustment('saturation', event.currentTarget.value)}
        />
      </div>

      <label className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm font-medium" htmlFor="grayscale-toggle">
        Grayscale
        <input
          id="grayscale-toggle"
          aria-label="Toggle grayscale conversion"
          type="checkbox"
          checked={processingSettings.grayscale}
          disabled={disabled}
          onChange={(event) => {
            updateProcessingPartial({ grayscale: event.currentTarget.checked });
            markPreviewDirty();
          }}
        />
      </label>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Background mode</legend>
        <div className="grid grid-cols-2 gap-2">
          {BACKGROUND_OPTIONS.map((option) => {
            const isActive = processingSettings.background.mode === option.mode;
            return (
              <Button
                key={option.mode}
                type="button"
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleBackgroundModeChange(option.mode)}
                disabled={disabled}
                aria-pressed={isActive}
                aria-label={`Set background to ${option.label}`}
              >
                {option.label}
              </Button>
            );
          })}
        </div>
      </fieldset>

      {showColorPicker && (
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Background color</legend>
          <div className="grid grid-cols-6 gap-2">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.color}
                type="button"
                onClick={() => handleBackgroundColorChange(preset.color)}
                disabled={disabled}
                className={cn(
                  'h-8 w-full rounded-md border transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                  customColor === preset.color && 'ring-2 ring-ring ring-offset-2',
                )}
                style={{ backgroundColor: preset.color }}
                aria-label={`Set background color to ${preset.label}`}
                aria-pressed={customColor === preset.color}
                title={preset.label}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="custom-color" className="text-xs text-muted-foreground">Custom color</label>
            <input
              id="custom-color"
              type="color"
              value={customColor}
              onChange={(event) => handleBackgroundColorChange(event.currentTarget.value)}
              disabled={disabled}
              className="h-8 w-12 cursor-pointer rounded border"
              aria-label="Custom background color picker"
            />
            <span className="text-xs text-muted-foreground">{customColor}</span>
          </div>
        </fieldset>
      )}

      {showBlurControl && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="background-blur-slider" className="text-sm font-medium">Background blur</label>
            <output htmlFor="background-blur-slider" className="text-xs text-muted-foreground">
              {processingSettings.background.blurAmount ?? 0}px
            </output>
          </div>
          <input
            id="background-blur-slider"
            aria-label="Background blur amount"
            className="w-full accent-primary"
            type="range"
            min={PROCESSING_LIMITS.blur.min}
            max={PROCESSING_LIMITS.blur.max}
            step={PROCESSING_LIMITS.blur.step}
            value={processingSettings.background.blurAmount ?? 0}
            disabled={disabled}
            onChange={(event) => handleBlurChange(event.currentTarget.value)}
          />
        </div>
      )}

      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={handleManualRefresh}
        disabled={disabled || pendingRefresh}
        aria-label="Refresh preview"
      >
        {pendingRefresh ? 'Refreshing preview…' : 'Refresh preview'}
      </Button>
    </section>
  );
}

export default ProcessingControls;
