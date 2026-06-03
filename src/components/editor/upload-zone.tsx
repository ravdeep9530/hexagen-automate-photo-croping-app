import { ImagePlus, Loader2, UploadCloud, XCircle } from "lucide-react";
import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import Cropper, { type Area } from "react-easy-crop";

import { useFileDrop } from "../../hooks/use-file-drop";
import { uploadImage as defaultUploadImage } from "../../lib/api-client";
import { validateUploadFile, DEFAULT_MAX_UPLOAD_SIZE_BYTES } from "../../lib/file-validators";
import { photoStore, type PhotoStore } from "../../store/photo-store";
import type { UploadZoneApiClient, UploadZoneStatus } from "../../types/upload";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

export interface UploadZoneProps {
  store?: PhotoStore;
  apiClient?: UploadZoneApiClient;
  maxSizeBytes?: number;
  userId?: string | null;
  onUploaded?: (imageId: string) => void;
}

const cx = (...classNames: Array<string | false | null | undefined>): string =>
  classNames.filter(Boolean).join(" ");

const getErrorMessage = (messages: string[]): string => messages.join(" ");

export const UploadZone = ({
  store = photoStore,
  apiClient = { uploadImage: defaultUploadImage },
  maxSizeBytes = DEFAULT_MAX_UPLOAD_SIZE_BYTES,
  userId,
  onUploaded,
}: UploadZoneProps) => {
  const inputId = useId();
  const errorId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<UploadZoneStatus>({ state: "idle", message: null });
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return undefined;
    }

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [selectedFile]);

  const handleFiles = async (files: File[]) => {
    const file = files[0] ?? null;
    const validation = validateUploadFile(file, { maxSizeBytes });

    if (!validation.valid || !file) {
      setSelectedFile(null);
      setStatus({ state: "error", message: getErrorMessage(validation.errors.map((error) => error.message)) });
      return;
    }

    setSelectedFile(file);
    setStatus({ state: "uploading", message: "Uploading image." });

    const result = await apiClient.uploadImage({
      file,
      filename: file.name,
      userId,
    });

    if (result.error) {
      store.getState().addValidationFailure({
        imageId: "client-upload",
        code: result.error.code,
        message: result.error.message,
      });
      setStatus({ state: "error", message: result.error.message });
      return;
    }

    store.getState().addImage(result.data.image);
    setStatus({ state: "uploaded", message: `${result.data.image.filename} uploaded successfully.` });
    onUploaded?.(result.data.image.id);
  };

  const { isDragging, dropZoneProps } = useFileDrop({
    disabled: status.state === "uploading",
    onFiles: handleFiles,
  });

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    void handleFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  const handleCropComplete = (_croppedArea: Area, croppedAreaPixels: Area) => {
    if (!selectedFile) {
      return;
    }

    store.getState().updateCrop({
      imageId: selectedFile.name,
      x: croppedAreaPixels.x,
      y: croppedAreaPixels.y,
      width: croppedAreaPixels.width,
      height: croppedAreaPixels.height,
      aspectRatio: null,
    });
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const errorMessage = status.state === "error" ? status.message : null;

  return (
    <section className="space-y-4" aria-label="Image upload">
      {errorMessage ? (
        <Alert
          id={errorId}
          aria-live="assertive"
          className="border-destructive/60 bg-destructive/5"
        >
          <div className="flex items-start gap-3">
            <XCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <AlertTitle>Upload failed</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </div>
          </div>
        </Alert>
      ) : null}

      <div
        {...dropZoneProps}
        onClick={openFileDialog}
        aria-label="Upload JPG, PNG, or WebP image"
        aria-describedby={errorMessage ? errorId : undefined}
        className={cx(
          "group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center outline-none transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/30 bg-background hover:bg-muted/50",
          status.state === "uploading" && "cursor-wait opacity-70",
        )}
      >
        <input
          ref={fileInputRef}
          id={inputId}
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          onChange={handleInputChange}
          disabled={status.state === "uploading"}
          aria-label="Choose image file"
        />
        <div className="mb-3 rounded-full bg-muted p-3 text-muted-foreground group-hover:text-foreground">
          {status.state === "uploading" ? (
            <Loader2 aria-hidden="true" className="h-6 w-6 animate-spin" />
          ) : (
            <UploadCloud aria-hidden="true" className="h-6 w-6" />
          )}
        </div>
        <p className="text-sm font-medium">Drag and drop an image, or browse files</p>
        <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, or WebP up to {Math.round(maxSizeBytes / 1024 / 1024)} MB</p>
      </div>

      {previewUrl ? (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <ImagePlus aria-hidden="true" className="h-4 w-4" />
            <h3 className="text-sm font-medium">Selected image preview</h3>
          </div>
          <div className="relative h-72 w-full bg-muted">
            <Cropper
              image={previewUrl}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
            />
          </div>
          <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm text-muted-foreground">
            <span className="truncate">{selectedFile?.name}</span>
            <label className="flex items-center gap-2">
              Zoom
              <input
                aria-label="Preview zoom"
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
              />
            </label>
          </div>
        </div>
      ) : null}

      {status.message && status.state !== "error" ? (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {status.message}
        </p>
      ) : null}
    </section>
  );
};
