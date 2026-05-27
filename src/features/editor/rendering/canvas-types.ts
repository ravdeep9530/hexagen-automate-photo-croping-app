import type { CropState, ImageAsset, ProcessingSettings } from '@/domain/assets';

export type PreviewBackgroundMode = 'original' | 'white' | 'solid';

export interface PresetDimensions {
  width: number;
  height: number;
}

export interface PreviewCropState extends CropState {
  /** Horizontal pan in source pixels after zoom is applied. */
  panX?: number;
  /** Vertical pan in source pixels after zoom is applied. */
  panY?: number;
}

export interface PreviewProcessingSettings extends Omit<ProcessingSettings, 'background'> {
  background: ProcessingSettings['background'] | {
    mode: PreviewBackgroundMode;
    color?: string;
  };
}

export type PreviewValidationIssueCode =
  | 'invalid-dimensions'
  | 'invalid-crop'
  | 'memory-budget-exceeded'
  | 'missing-source'
  | 'aborted'
  | 'canvas-unavailable'
  | 'browser-render-failed'
  | 'encode-failed';

export interface PreviewValidationIssue {
  code: PreviewValidationIssueCode;
  message: string;
  severity: 'warning' | 'error';
  details?: Record<string, unknown>;
}

export interface PreviewRenderRequest {
  asset: ImageAsset;
  presetDimensions: PresetDimensions;
  crop: PreviewCropState;
  processing: PreviewProcessingSettings;
  maxPreviewPixels: number;
  signal?: AbortSignal;
  output?: 'object-url' | 'data-url';
  mimeType?: 'image/png' | 'image/jpeg' | 'image/webp';
  quality?: number;
}

export interface PreviewRenderResult {
  url?: string;
  width: number;
  height: number;
  validationIssues: PreviewValidationIssue[];
  renderTimeMs: number;
  aborted: boolean;
}

export interface CanvasLike {
  width: number;
  height: number;
  getContext(contextId: '2d'): CanvasRenderingContext2D | null;
  toDataURL?: (type?: string, quality?: number) => string;
  toBlob?: (callback: (blob: Blob | null) => void, type?: string, quality?: number) => void;
}

export interface PreviewRendererAdapters {
  createCanvas?: (width: number, height: number) => CanvasLike;
  loadImage?: (asset: ImageAsset, signal?: AbortSignal) => Promise<CanvasImageSource>;
  createObjectUrl?: (blob: Blob) => string;
  revokeObjectUrl?: (url: string) => void;
  now?: () => number;
}
