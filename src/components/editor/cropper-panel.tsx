import * as React from "react";
import type { StoreApi } from "zustand/vanilla";

import { useCropControls } from "../../hooks/use-crop-controls";
import type { CropAreaPixels, CropPoint } from "../../hooks/use-crop-controls";
import { useFeatureFlag } from "../../hooks/use-feature-flag";
import { cropImage as defaultCropImage } from "../../lib/api-client";
import { photoStore, type PhotoStore } from "../../store/photo-store";
import type {
  ApiResult,
  CropImageResponse,
  CropMetaData,
  UploadedImage,
} from "../../types/entities";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { CropControls } from "./crop-controls";
import { FeatureFlagBanner } from "./feature-flag-banner";

export interface CropperPanelProps {
  cropImage?: typeof defaultCropImage;
  image: UploadedImage;
  imageAlt?: string;
  imageUrl: string;
  onCropConfirmed?: (response: CropImageResponse) => void;
  store?: StoreApi<PhotoStore>;
}

export interface EasyCropAdapterProps {
  aspect: number;
  crop: CropPoint;
  image: string;
  onCropChange: (crop: CropPoint) => void;
  onCropComplete: (croppedArea: CropAreaPixels, croppedAreaPixels: CropAreaPixels) => void;
  onZoomChange: (zoom: number) => void;
  zoom: number;
}

const screenReaderOnlyClassName =
  "absolute h-px w-px -m-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0,0,0,0)]";

function DefaultEasyCropAdapter({
  aspect,
  crop,
  image,
  onCropChange,
  onCropComplete,
  onZoomChange,
  zoom,
}: EasyCropAdapterProps): React.JSX.Element {
  React.useEffect(() => {
    const width = Math.round(240 * Math.min(aspect, 1));
    const height = Math.round(width / aspect);
    onCropComplete(
      { height, width, x: Math.round(crop.x), y: Math.round(crop.y) },
      { height, width, x: Math.round(crop.x), y: Math.round(crop.y) },
    );
  }, [aspect, crop.x, crop.y, onCropComplete]);

  return (
    <div className="relative flex min-h-80 items-center justify-center overflow-hidden rounded-lg bg-slate-950">
      <img
        alt=""
        aria-hidden="true"
        className="max-h-80 max-w-full select-none object-contain"
        draggable={false}
        src={image}
        style={{
          transform: `translate(${crop.x}px, ${crop.y}px) scale(${zoom})`,
          transformOrigin: "center",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute border-2 border-white shadow-[0_0_0_9999px_rgba(15,23,42,0.55)]"
        style={{
          aspectRatio: `${aspect}`,
          width: "55%",
        }}
      />
      <input
        aria-label="Adjust crop zoom"
        className={screenReaderOnlyClassName}
        max={3}
        min={1}
        onChange={(event) => onZoomChange(Number(event.currentTarget.value))}
        step={0.1}
        type="range"
        value={zoom}
      />
      <button
        className={screenReaderOnlyClassName}
        onClick={() => onCropChange(crop)}
        type="button"
      >
        Sync crop position
      </button>
    </div>
  );
}

function toCropMetadata(area: CropAreaPixels | null): CropMetaData {
  return {
    height: Math.max(1, Math.round(area?.height ?? 1)),
    width: Math.max(1, Math.round(area?.width ?? 1)),
    x: Math.round(area?.x ?? 0),
    y: Math.round(area?.y ?? 0),
  };
}

export default function CropperPanel({
  cropImage = defaultCropImage,
  image,
  imageAlt,
  imageUrl,
  onCropConfirmed,
  store = photoStore,
}: CropperPanelProps): React.JSX.Element {
  const cropRegionRef = React.useRef<HTMLDivElement | null>(null);
  const statusRef = React.useRef<HTMLParagraphElement | null>(null);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [isCropping, setIsCropping] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState(
    "Crop editor ready. Use arrow keys to move the crop area.",
  );
  const controls = useCropControls({ aspectRatio: 1, initialZoom: 1, keyboardStep: 2 });
  const featureFlag = useFeatureFlag({ userId: image.user_id });
  const descriptionId = React.useId();
  const statusId = React.useId();

  React.useEffect(() => {
    if (featureFlag.enabled) {
      cropRegionRef.current?.focus();
    }
  }, [featureFlag.enabled, imageUrl]);

  const handleCropComplete = React.useCallback(
    (_croppedArea: CropAreaPixels, croppedAreaPixels: CropAreaPixels) => {
      controls.setCropAreaPixels(croppedAreaPixels);
    },
    [controls],
  );

  const handleKeyDown = React.useCallback<React.KeyboardEventHandler<HTMLDivElement>>(
    (event) => {
      controls.handleKeyDown(event);
      if (event.key.startsWith("Arrow")) {
        setStatusMessage(`Crop moved with ${event.key.replace("Arrow", "").toLowerCase()} arrow.`);
      }
    },
    [controls],
  );

  const handleConfirmCrop = React.useCallback(async () => {
    setErrorMessage("");
    setIsCropping(true);
    setStatusMessage("Cropping image. Please wait.");

    const cropMetadata = toCropMetadata(controls.cropAreaPixels);
    store.getState().updateCrop(image.id, cropMetadata);

    const result: ApiResult<CropImageResponse> = await cropImage({
      crop_metadata: cropMetadata,
      image_id: image.id,
    });

    if (!result.ok) {
      setErrorMessage(result.error.message);
      setStatusMessage("Crop failed. Review the error message and try again.");
      setIsCropping(false);
      cropRegionRef.current?.focus();
      return;
    }

    store.getState().addProcessedPhoto(result.data.processed_photo);
    setStatusMessage("Crop confirmed successfully.");
    setIsCropping(false);
    onCropConfirmed?.(result.data);
    statusRef.current?.focus();
  }, [controls.cropAreaPixels, cropImage, image.id, onCropConfirmed, store]);

  if (!featureFlag.enabled) {
    return (
      <section aria-labelledby="cropper-panel-title" className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold" id="cropper-panel-title">
            Crop photo
          </h2>
          <p className="text-sm text-slate-600">
            Cropping access is controlled by a feature flag and may not be available to all users.
          </p>
        </div>
        <FeatureFlagBanner
          errorMessage={featureFlag.errorMessage}
          status={featureFlag.status}
        />
      </section>
    );
  }

  return (
    <section aria-labelledby="cropper-panel-title" className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold" id="cropper-panel-title">
          Crop photo
        </h2>
        <p className="text-sm text-slate-600" id={descriptionId}>
          Use the crop editor to frame {imageAlt ?? image.filename}. Move the crop with arrow
          keys, hold Shift for larger steps, then confirm the crop.
        </p>
      </div>

      {errorMessage.length > 0 ? (
        <Alert aria-live="assertive" role="alert">
          <AlertTitle>Crop error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div
        aria-describedby={`${descriptionId} ${statusId}`}
        aria-description="Interactive image crop area. Arrow keys move the crop area. Zoom and aspect ratio controls are below."
        aria-label="Image crop area"
        aria-roledescription="image cropper"
        className="outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        onKeyDown={handleKeyDown}
        ref={cropRegionRef}
        role="application"
        tabIndex={0}
      >
        <DefaultEasyCropAdapter
          aspect={controls.aspectRatio}
          crop={controls.crop}
          image={imageUrl}
          onCropChange={controls.setCrop}
          onCropComplete={handleCropComplete}
          onZoomChange={controls.setZoom}
          zoom={controls.zoom}
        />
      </div>

      <p
        aria-live="polite"
        className="text-sm text-slate-600"
        id={statusId}
        ref={statusRef}
        tabIndex={-1}
      >
        {statusMessage}
      </p>

      <CropControls
        aspectRatio={controls.aspectRatio}
        disabled={image.status === "processing"}
        isCropping={isCropping}
        maxZoom={controls.maxZoom}
        minZoom={controls.minZoom}
        onAspectRatioChange={controls.setAspectRatio}
        onConfirmCrop={() => void handleConfirmCrop()}
        onZoomChange={controls.setZoom}
        zoom={controls.zoom}
      />
    </section>
  );
}
