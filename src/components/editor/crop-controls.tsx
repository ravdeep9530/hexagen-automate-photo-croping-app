import type { ChangeEvent } from "react";

import type { CropAspectRatioOption } from "../../hooks/use-crop-controls";

export interface CropControlsProps {
  aspectRatio: CropAspectRatioOption;
  zoom: number;
  disabled?: boolean;
  busy?: boolean;
  onZoomChange: (zoom: number) => void;
  onAspectRatioChange: (aspectRatio: CropAspectRatioOption) => void;
  onConfirmCrop: () => void;
}

const ASPECT_RATIO_OPTIONS: Array<{ label: string; value: CropAspectRatioOption }> = [
  { label: "1:1", value: "1:1" },
  { label: "4:3", value: "4:3" },
  { label: "16:9", value: "16:9" },
  { label: "Free", value: "free" },
];

export const CropControls = ({
  aspectRatio,
  zoom,
  disabled = false,
  busy = false,
  onZoomChange,
  onAspectRatioChange,
  onConfirmCrop,
}: CropControlsProps) => {
  const handleZoomChange = (event: ChangeEvent<HTMLInputElement>) => {
    onZoomChange(Number(event.target.value));
  };

  return (
    <div className="flex flex-col gap-4 border-t px-4 py-4 md:flex-row md:items-end md:justify-between">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
          <span>Zoom</span>
          <input
            aria-label="Crop zoom"
            type="range"
            min="1"
            max="3"
            step="0.1"
            value={zoom}
            onChange={handleZoomChange}
            disabled={disabled || busy}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
          <span>Aspect ratio</span>
          <select
            aria-label="Crop aspect ratio"
            className="rounded-md border bg-background px-3 py-2 text-sm"
            value={aspectRatio}
            onChange={(event) => onAspectRatioChange(event.target.value as CropAspectRatioOption)}
            disabled={disabled || busy}
          >
            {ASPECT_RATIO_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        type="button"
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
        onClick={onConfirmCrop}
        disabled={disabled || busy}
      >
        {busy ? "Cropping…" : "Confirm crop"}
      </button>
    </div>
  );
};
