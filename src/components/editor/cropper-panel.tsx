import { Loader2, Move, Scissors } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import Cropper, { type Area } from "react-easy-crop";

import { CropControls } from "./crop-controls";
import { FeatureFlagBanner } from "./feature-flag-banner";
import {
  useCropControls,
  type CropAspectRatioOption,
} from "../../hooks/use-crop-controls";
import { useFeatureFlag, type UseFeatureFlagApiClient } from "../../hooks/use-feature-flag";
import {
  checkCroppingFeatureFlag as defaultCheckCroppingFeatureFlag,
  cropImage as defaultCropImage,
} from "../../lib/api-client";
import { photoStore, type PhotoStore } from "../../store/photo-store";
import type { ApiClientResult, CropImageResponse, CropMetaData, UploadedImage } from "../../types/entities";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

export interface CropperPanelApiClient extends UseFeatureFlagApiClient {
  cropImage: (request: {
    imageId: string;
    crop: CropMetaData;
  }) => Promise<ApiClientResult<CropImageResponse>>;
}

export interface CropperPanelProps {
  image: UploadedImage;
  imageUrl: string;
  store?: PhotoStore;
  apiClient?: CropperPanelApiClient;
  ariaDescription?: string;
  onCropConfirmed?: (photoId: string) => void;
}

const getInitialAspectRatio = (aspectRatio: number | null | undefined): CropAspectRatioOption => {
  if (aspectRatio === 1) {
    return "1:1";
  }

  if (aspectRatio === 4 / 3) {
    return "4:3";
  }

  if (aspectRatio === 16 / 9) {
    return "16:9";
  }

  return "free";
};

export const CropperPanel = ({
  image,
  imageUrl,
  store = photoStore,
  apiClient = {
    cropImage: defaultCropImage,
    checkCroppingFeatureFlag: defaultCheckCroppingFeatureFlag,
  },
  ariaDescription = "Use arrow keys to reposition the crop area, adjust zoom and aspect ratio, then confirm the crop.",
  onCropConfirmed,
}: CropperPanelProps) => {
  const existingCrop = useMemo(
    () => store.getState().crops.find((entry) => entry.imageId === image.id),
    [image.id, store],
  );
  const {
    crop,
    zoom,
    aspectRatio,
    aspectValue,
    setCrop,
    setZoom,
    setAspectRatio,
    handleArrowKey,
  } = useCropControls({
    initialCrop: existingCrop ? { x: existingCrop.x, y: existingCrop.y } : { x: 0, y: 0 },
    initialAspectRatio: getInitialAspectRatio(existingCrop?.aspectRatio),
  });
  const { enabled, loading, errorMessage: featureFlagError } = useFeatureFlag(image.userId, {
    checkCroppingFeatureFlag: apiClient.checkCroppingFeatureFlag,
  });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(
    existingCrop
      ? {
          x: existingCrop.x,
          y: existingCrop.y,
          width: existingCrop.width,
          height: existingCrop.height,
        }
      : null,
  );
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const focusRef = useRef<HTMLDivElement | null>(null);
  const descriptionId = useId();
  const errorId = useId();

  useEffect(() => {
    if (enabled) {
      focusRef.current?.focus();
    }
  }, [enabled, image.id]);

  const persistCrop = (area: Area) => {
    store.getState().updateCrop({
      imageId: image.id,
      x: area.x,
      y: area.y,
      width: area.width,
      height: area.height,
      aspectRatio: aspectValue ?? null,
    });
  };

  const handleCropComplete = (_croppedArea: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
    persistCrop(areaPixels);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const handled = handleArrowKey(event.nativeEvent);

    if (!handled || !croppedAreaPixels) {
      return;
    }

    const nextArea = {
      ...croppedAreaPixels,
      x: crop.x + (event.key === "ArrowRight" ? 10 : event.key === "ArrowLeft" ? -10 : 0),
      y: crop.y + (event.key === "ArrowDown" ? 10 : event.key === "ArrowUp" ? -10 : 0),
    };

    setCroppedAreaPixels(nextArea);
    persistCrop(nextArea);
  };

  const handleConfirmCrop = async () => {
    const area = croppedAreaPixels;

    if (!area) {
      return;
    }

    setStatus("submitting");
    setErrorMessage(null);

    const cropPayload: CropMetaData = {
      imageId: image.id,
      x: area.x,
      y: area.y,
      width: area.width,
      height: area.height,
      aspectRatio: aspectValue ?? null,
    };

    store.getState().updateCrop(cropPayload);

    const result = await apiClient.cropImage({
      imageId: image.id,
      crop: cropPayload,
    });

    if (result.error) {
      setStatus("error");
      setErrorMessage(result.error.message);
      return;
    }

    store.getState().addProcessedPhoto(result.data.photo);
    setStatus("idle");
    onCropConfirmed?.(result.data.photo.id);
  };

  if (!enabled) {
    return <FeatureFlagBanner loading={loading} enabled={enabled} errorMessage={featureFlagError} />;
  }

  return (
    <section className="overflow-hidden rounded-xl border bg-card" aria-label="Crop image panel">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Scissors aria-hidden="true" className="h-4 w-4" />
        <h2 className="text-sm font-medium">Crop photo</h2>
      </div>

      {errorMessage ? (
        <Alert id={errorId} aria-live="assertive" className="m-4 border-destructive/60 bg-destructive/5">
          <AlertTitle>Crop failed</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div
        ref={focusRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-describedby={[descriptionId, errorMessage ? errorId : null].filter(Boolean).join(" ")}
        aria-description={ariaDescription}
        className="outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <div className="flex items-center gap-2 px-4 pt-4 text-xs text-muted-foreground">
          <Move aria-hidden="true" className="h-4 w-4" />
          <p id={descriptionId}>{ariaDescription}</p>
        </div>

        <div className="relative mt-4 h-80 w-full bg-muted">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspectValue}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>
      </div>

      <CropControls
        aspectRatio={aspectRatio}
        zoom={zoom}
        busy={status === "submitting"}
        onZoomChange={setZoom}
        onAspectRatioChange={setAspectRatio}
        onConfirmCrop={handleConfirmCrop}
      />

      {status === "submitting" ? (
        <div className="flex items-center gap-2 px-4 pb-4 text-sm text-muted-foreground" aria-live="polite">
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          <span>Submitting crop…</span>
        </div>
      ) : null}
    </section>
  );
};
