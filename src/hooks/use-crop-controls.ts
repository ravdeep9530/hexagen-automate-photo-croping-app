import { useCallback, useMemo, useState } from "react";

export type CropAspectRatioOption = "1:1" | "4:3" | "16:9" | "free";

export interface CropPoint {
  x: number;
  y: number;
}

export interface UseCropControlsOptions {
  initialAspectRatio?: CropAspectRatioOption;
  initialZoom?: number;
  initialCrop?: CropPoint;
  keyboardStep?: number;
  minZoom?: number;
  maxZoom?: number;
}

export interface UseCropControlsResult {
  aspectRatio: CropAspectRatioOption;
  aspectValue: number | undefined;
  crop: CropPoint;
  zoom: number;
  setCrop: (crop: CropPoint) => void;
  setZoom: (zoom: number) => void;
  setAspectRatio: (aspectRatio: CropAspectRatioOption) => void;
  nudgeCrop: (deltaX: number, deltaY: number) => void;
  handleArrowKey: (event: Pick<KeyboardEvent, "key" | "preventDefault">) => boolean;
  reset: () => void;
}

const ASPECT_RATIO_VALUES: Record<Exclude<CropAspectRatioOption, "free">, number> = {
  "1:1": 1,
  "4:3": 4 / 3,
  "16:9": 16 / 9,
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const getAspectRatioValue = (
  aspectRatio: CropAspectRatioOption,
): number | undefined => {
  if (aspectRatio === "free") {
    return undefined;
  }

  return ASPECT_RATIO_VALUES[aspectRatio];
};

export const useCropControls = ({
  initialAspectRatio = "1:1",
  initialZoom = 1,
  initialCrop = { x: 0, y: 0 },
  keyboardStep = 10,
  minZoom = 1,
  maxZoom = 3,
}: UseCropControlsOptions = {}): UseCropControlsResult => {
  const [aspectRatio, setAspectRatio] = useState<CropAspectRatioOption>(initialAspectRatio);
  const [zoom, setZoomState] = useState(initialZoom);
  const [crop, setCropState] = useState<CropPoint>(initialCrop);

  const setZoom = useCallback(
    (nextZoom: number) => {
      setZoomState(clamp(nextZoom, minZoom, maxZoom));
    },
    [maxZoom, minZoom],
  );

  const setCrop = useCallback((nextCrop: CropPoint) => {
    setCropState(nextCrop);
  }, []);

  const nudgeCrop = useCallback((deltaX: number, deltaY: number) => {
    setCropState((current) => ({
      x: current.x + deltaX,
      y: current.y + deltaY,
    }));
  }, []);

  const handleArrowKey = useCallback(
    (event: Pick<KeyboardEvent, "key" | "preventDefault">) => {
      switch (event.key) {
        case "ArrowUp":
          event.preventDefault();
          nudgeCrop(0, -keyboardStep);
          return true;
        case "ArrowDown":
          event.preventDefault();
          nudgeCrop(0, keyboardStep);
          return true;
        case "ArrowLeft":
          event.preventDefault();
          nudgeCrop(-keyboardStep, 0);
          return true;
        case "ArrowRight":
          event.preventDefault();
          nudgeCrop(keyboardStep, 0);
          return true;
        default:
          return false;
      }
    },
    [keyboardStep, nudgeCrop],
  );

  const reset = useCallback(() => {
    setAspectRatio(initialAspectRatio);
    setZoomState(clamp(initialZoom, minZoom, maxZoom));
    setCropState(initialCrop);
  }, [initialAspectRatio, initialCrop, initialZoom, maxZoom, minZoom]);

  const aspectValue = useMemo(() => getAspectRatioValue(aspectRatio), [aspectRatio]);

  return {
    aspectRatio,
    aspectValue,
    crop,
    zoom,
    setCrop,
    setZoom,
    setAspectRatio,
    nudgeCrop,
    handleArrowKey,
    reset,
  };
};
