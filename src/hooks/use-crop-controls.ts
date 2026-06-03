import * as React from "react";

export interface CropPoint {
  x: number;
  y: number;
}

export interface CropAreaPixels {
  height: number;
  width: number;
  x: number;
  y: number;
}

export interface UseCropControlsOptions {
  aspectRatio?: number;
  initialCrop?: CropPoint;
  initialZoom?: number;
  keyboardStep?: number;
  maxZoom?: number;
  minZoom?: number;
}

export interface UseCropControlsResult {
  aspectRatio: number;
  crop: CropPoint;
  cropAreaPixels: CropAreaPixels | null;
  handleKeyDown: (event: Pick<React.KeyboardEvent<HTMLElement>, "key" | "preventDefault" | "shiftKey">) => void;
  maxZoom: number;
  minZoom: number;
  nudgeCrop: (delta: CropPoint) => void;
  setAspectRatio: React.Dispatch<React.SetStateAction<number>>;
  setCrop: React.Dispatch<React.SetStateAction<CropPoint>>;
  setCropAreaPixels: React.Dispatch<React.SetStateAction<CropAreaPixels | null>>;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  zoom: number;
}

const DEFAULT_ASPECT_RATIO = 1;
const DEFAULT_KEYBOARD_STEP = 1;
const DEFAULT_MAX_ZOOM = 3;
const DEFAULT_MIN_ZOOM = 1;

function clampZoom(value: number, minZoom: number, maxZoom: number): number {
  return Math.min(Math.max(value, minZoom), maxZoom);
}

export function useCropControls({
  aspectRatio = DEFAULT_ASPECT_RATIO,
  initialCrop = { x: 0, y: 0 },
  initialZoom = DEFAULT_MIN_ZOOM,
  keyboardStep = DEFAULT_KEYBOARD_STEP,
  maxZoom = DEFAULT_MAX_ZOOM,
  minZoom = DEFAULT_MIN_ZOOM,
}: UseCropControlsOptions = {}): UseCropControlsResult {
  const [crop, setCrop] = React.useState<CropPoint>(initialCrop);
  const [zoom, setZoomState] = React.useState(() =>
    clampZoom(initialZoom, minZoom, maxZoom),
  );
  const [currentAspectRatio, setAspectRatio] = React.useState(aspectRatio);
  const [cropAreaPixels, setCropAreaPixels] = React.useState<CropAreaPixels | null>(null);

  const setZoom = React.useCallback<React.Dispatch<React.SetStateAction<number>>>(
    (nextZoom) => {
      setZoomState((currentZoom) => {
        const resolvedZoom =
          typeof nextZoom === "function" ? nextZoom(currentZoom) : nextZoom;
        return clampZoom(resolvedZoom, minZoom, maxZoom);
      });
    },
    [maxZoom, minZoom],
  );

  const nudgeCrop = React.useCallback((delta: CropPoint) => {
    setCrop((currentCrop) => ({
      x: currentCrop.x + delta.x,
      y: currentCrop.y + delta.y,
    }));
  }, []);

  const handleKeyDown = React.useCallback<UseCropControlsResult["handleKeyDown"]>(
    (event) => {
      const step = event.shiftKey ? keyboardStep * 10 : keyboardStep;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          nudgeCrop({ x: 0, y: step });
          break;
        case "ArrowLeft":
          event.preventDefault();
          nudgeCrop({ x: -step, y: 0 });
          break;
        case "ArrowRight":
          event.preventDefault();
          nudgeCrop({ x: step, y: 0 });
          break;
        case "ArrowUp":
          event.preventDefault();
          nudgeCrop({ x: 0, y: -step });
          break;
        default:
          break;
      }
    },
    [keyboardStep, nudgeCrop],
  );

  return {
    aspectRatio: currentAspectRatio,
    crop,
    cropAreaPixels,
    handleKeyDown,
    maxZoom,
    minZoom,
    nudgeCrop,
    setAspectRatio,
    setCrop,
    setCropAreaPixels,
    setZoom,
    zoom,
  };
}
