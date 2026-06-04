'use client';

import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import Cropper from 'react-easy-crop';

type CropPoint = {
  x: number;
  y: number;
};

type CroppedAreaPixels = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type GuidelineRequirement = {
  id: string;
  label: string;
  description: string;
};

type GuidelineVisual = {
  id: string;
  label: string;
  assetUrl: string;
  altText: string;
};

type PhotoGuidelinesResponse = {
  requirements: GuidelineRequirement[];
  visuals: GuidelineVisual[];
};

type SaveCroppedPhotoResponse = {
  croppedImageId?: string;
  url?: string;
  complianceStatus?: string;
  message?: string;
};

type FetchState = 'idle' | 'loading' | 'success' | 'error';
type SaveState = 'idle' | 'saving' | 'error';

export type CropperModalProps = {
  imageSrc: string;
  imageId: string;
  isOpen: boolean;
  onClose: () => void;
  onCropSaved?: (result: { croppedImageId: string; url: string; complianceStatus?: string }) => void;
};

const PASSPORT_ASPECT_RATIO = 4 / 5;
const KEYBOARD_MOVE_STEP = 5;
const KEYBOARD_ZOOM_STEP = 0.1;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const initialGuidelines: PhotoGuidelinesResponse = { requirements: [], visuals: [] };

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(value.toFixed(2))));
}

export default function CropperModal({ imageSrc, imageId, isOpen, onClose, onCropSaved }: CropperModalProps) {
  const [crop, setCrop] = useState<CropPoint>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);
  const [guidelines, setGuidelines] = useState<PhotoGuidelinesResponse>(initialGuidelines);
  const [guidelinesStatus, setGuidelinesStatus] = useState<FetchState>('idle');
  const [guidelinesError, setGuidelinesError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  const guidelineVisual = guidelines.visuals[0] ?? null;

  const resetState = useCallback(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setSaveState('idle');
    setSaveError(null);
  }, []);

  const loadGuidelines = useCallback(async () => {
    setGuidelinesStatus('loading');
    setGuidelinesError(null);

    try {
      const response = await fetch('/api/photoGuidelines');
      const payload = (await response.json()) as Partial<PhotoGuidelinesResponse> & { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to load passport photo guidelines.');
      }

      setGuidelines({
        requirements: Array.isArray(payload.requirements) ? payload.requirements : [],
        visuals: Array.isArray(payload.visuals) ? payload.visuals : [],
      });
      setGuidelinesStatus('success');
    } catch (error) {
      setGuidelines(initialGuidelines);
      setGuidelinesError(error instanceof Error ? error.message : 'Unable to load passport photo guidelines.');
      setGuidelinesStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    resetState();
    void loadGuidelines();
  }, [isOpen, loadGuidelines, resetState]);

  const liveMessage = useMemo(() => {
    if (saveState === 'saving') {
      return 'Saving cropped photo...';
    }

    if (saveError) {
      return saveError;
    }

    if (guidelinesStatus === 'loading') {
      return 'Loading passport photo guidelines...';
    }

    if (guidelinesStatus === 'error' && guidelinesError) {
      return `Unable to load guidelines. ${guidelinesError}`;
    }

    return 'Adjust the crop and save your photo.';
  }, [guidelinesError, guidelinesStatus, saveError, saveState]);

  const handleKeyboardAdjust = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (!isOpen) {
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setCrop((current) => ({ ...current, y: current.y - KEYBOARD_MOVE_STEP }));
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setCrop((current) => ({ ...current, y: current.y + KEYBOARD_MOVE_STEP }));
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setCrop((current) => ({ ...current, x: current.x - KEYBOARD_MOVE_STEP }));
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      setCrop((current) => ({ ...current, x: current.x + KEYBOARD_MOVE_STEP }));
      return;
    }

    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      setZoom((current) => clampZoom(current + KEYBOARD_ZOOM_STEP));
      return;
    }

    if (event.key === '-') {
      event.preventDefault();
      setZoom((current) => clampZoom(current - KEYBOARD_ZOOM_STEP));
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  }, [isOpen, onClose]);

  const handleSave = useCallback(async () => {
    if (!croppedAreaPixels) {
      setSaveError('Adjust the crop area before saving.');
      setSaveState('error');
      return;
    }

    setSaveState('saving');
    setSaveError(null);

    try {
      const response = await fetch('/api/saveCroppedPhoto', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          imageId,
          x: Math.round(croppedAreaPixels.x),
          y: Math.round(croppedAreaPixels.y),
          width: Math.round(croppedAreaPixels.width),
          height: Math.round(croppedAreaPixels.height),
          aspectRatio: PASSPORT_ASPECT_RATIO,
        }),
      });

      const payload = (await response.json()) as SaveCroppedPhotoResponse;

      if (!response.ok || !payload.croppedImageId || !payload.url) {
        throw new Error(payload.message || 'Failed to save cropped photo.');
      }

      setSaveState('idle');
      onCropSaved?.({
        croppedImageId: payload.croppedImageId,
        url: payload.url,
        complianceStatus: payload.complianceStatus,
      });
      onClose();
    } catch (error) {
      setSaveState('error');
      setSaveError(error instanceof Error ? error.message : 'Failed to save cropped photo.');
    }
  }, [croppedAreaPixels, imageId, onClose, onCropSaved]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      aria-labelledby="cropper-modal-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
      role="dialog"
    >
      <div className="w-full max-w-5xl rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-950" id="cropper-modal-title">
              Crop your photo
            </h2>
            <p className="mt-1 text-sm text-slate-700">
              Use the crop area to align your face with the passport guideline overlay.
            </p>
          </div>
          <button
            aria-label="Close cropper modal"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
          <div>
            <div
              aria-describedby="cropper-keyboard-help"
              aria-label="Photo cropper"
              className="relative h-[420px] overflow-hidden rounded-lg bg-slate-950 outline-none"
              onKeyDown={handleKeyboardAdjust}
              tabIndex={0}
            >
              <Cropper
                aspect={PASSPORT_ASPECT_RATIO}
                crop={crop}
                image={imageSrc}
                objectFit="contain"
                onCropChange={setCrop}
                onCropComplete={(_, pixels) => {
                  setCroppedAreaPixels(pixels);
                }}
                onZoomChange={setZoom}
                showGrid={false}
                zoom={zoom}
              />
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 border-2 border-white/80">
                <div className="absolute left-1/2 top-[18%] h-8 w-8 -translate-x-1/2 rounded-full border-2 border-emerald-300" />
                <div className="absolute left-[22%] right-[22%] top-[30%] h-[42%] rounded-[45%] border-2 border-emerald-300" />
              </div>
              {guidelineVisual ? (
                <img
                  alt={guidelineVisual.altText}
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 h-full w-full object-contain opacity-40"
                  src={guidelineVisual.assetUrl}
                />
              ) : null}
            </div>

            <p className="mt-3 text-sm text-slate-700" id="cropper-keyboard-help">
              Use arrow keys to move the crop. Press plus or minus to zoom. Press Escape to close.
            </p>

            <div className="mt-4 flex items-center gap-3">
              <label className="text-sm font-medium text-slate-900" htmlFor="cropper-zoom-range">
                Zoom
              </label>
              <input
                aria-label="Zoom crop"
                id="cropper-zoom-range"
                max={MAX_ZOOM}
                min={MIN_ZOOM}
                onChange={(event) => {
                  setZoom(clampZoom(Number(event.target.value)));
                }}
                step={KEYBOARD_ZOOM_STEP}
                type="range"
                value={zoom}
              />
              <span className="text-sm text-slate-700">{zoom.toFixed(1)}x</span>
            </div>
          </div>

          <aside className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Preview</h3>
              <img alt="Uploaded photo preview" className="mt-3 w-full rounded-md border border-slate-300" src={imageSrc} />
            </div>

            <div aria-live="polite" className="text-sm text-slate-800">
              <p>{liveMessage}</p>
            </div>

            {guidelinesStatus === 'success' && guidelines.requirements.length > 0 ? (
              <div>
                <h4 className="text-sm font-semibold text-slate-950">Guidelines</h4>
                <ul className="mt-2 space-y-2 text-sm text-slate-700">
                  {guidelines.requirements.map((requirement) => (
                    <li key={requirement.id}>
                      <span className="font-medium text-slate-900">{requirement.label}:</span> {requirement.description}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {guidelinesStatus === 'error' ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <p>Unable to load guidelines. {guidelinesError}</p>
                <button
                  aria-label="Retry loading crop guidelines"
                  className="mt-3 rounded-md bg-slate-900 px-3 py-2 text-white"
                  onClick={() => {
                    void loadGuidelines();
                  }}
                  type="button"
                >
                  Retry
                </button>
              </div>
            ) : null}

            {saveError ? <p className="text-sm font-medium text-red-700">{saveError}</p> : null}

            <div className="flex gap-3">
              <button
                aria-label="Save cropped photo"
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                disabled={saveState === 'saving'}
                onClick={() => {
                  void handleSave();
                }}
                type="button"
              >
                {saveState === 'saving' ? 'Saving...' : 'Save crop'}
              </button>
              <button
                aria-label="Cancel cropping"
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900"
                onClick={onClose}
                type="button"
              >
                Cancel
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
