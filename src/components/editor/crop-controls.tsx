import * as React from "react";

export interface AspectRatioOption {
  label: string;
  value: number;
}

export interface CropControlsProps {
  aspectRatio: number;
  aspectRatioOptions?: AspectRatioOption[];
  disabled?: boolean;
  isCropping?: boolean;
  maxZoom?: number;
  minZoom?: number;
  onAspectRatioChange: (aspectRatio: number) => void;
  onConfirmCrop: () => void;
  onZoomChange: (zoom: number) => void;
  zoom: number;
}

const defaultAspectRatioOptions: AspectRatioOption[] = [
  { label: "Square", value: 1 },
  { label: "Portrait 4:5", value: 4 / 5 },
  { label: "Landscape 16:9", value: 16 / 9 },
];

function formatZoomValue(zoom: number): string {
  return `${Math.round(zoom * 100)}%`;
}

export function CropControls({
  aspectRatio,
  aspectRatioOptions = defaultAspectRatioOptions,
  disabled = false,
  isCropping = false,
  maxZoom = 3,
  minZoom = 1,
  onAspectRatioChange,
  onConfirmCrop,
  onZoomChange,
  zoom,
}: CropControlsProps): React.JSX.Element {
  const zoomDescriptionId = React.useId();

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="crop-zoom-control">
          Zoom ({formatZoomValue(zoom)})
        </label>
        <input
          aria-describedby={zoomDescriptionId}
          className="w-full"
          disabled={disabled || isCropping}
          id="crop-zoom-control"
          max={maxZoom}
          min={minZoom}
          onChange={(event) => onZoomChange(Number(event.currentTarget.value))}
          step={0.1}
          type="range"
          value={zoom}
        />
        <p className="text-xs text-slate-600" id={zoomDescriptionId}>
          Increase zoom to crop closer into the uploaded image.
        </p>
      </div>

      <fieldset className="space-y-2" disabled={disabled || isCropping}>
        <legend className="text-sm font-medium">Aspect ratio</legend>
        <div className="flex flex-wrap gap-2">
          {aspectRatioOptions.map((option) => {
            const isSelected = Math.abs(option.value - aspectRatio) < 0.001;

            return (
              <button
                aria-pressed={isSelected}
                className={`rounded-md border px-3 py-2 text-sm ${
                  isSelected
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-300 bg-white text-slate-700"
                }`}
                key={option.label}
                onClick={() => onAspectRatioChange(option.value)}
                type="button"
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <button
        className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={disabled || isCropping}
        onClick={onConfirmCrop}
        type="button"
      >
        {isCropping ? "Cropping…" : "Confirm crop"}
      </button>
    </div>
  );
}
