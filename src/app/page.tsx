"use client";

import * as React from "react";
import type { StoreApi } from "zustand/vanilla";

import CropperPanel from "../components/editor/cropper-panel";
import DownloadPanel from "../components/editor/download-panel";
import {
  ErrorBanner,
  type ErrorBannerOperation,
} from "../components/editor/error-banner";
import UploadZone from "../components/editor/upload-zone";
import { ValidationBanner } from "../components/editor/validation-banner";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import {
  cropImage as defaultCropImage,
  downloadCroppedPhoto as defaultDownloadCroppedPhoto,
  uploadImage as defaultUploadImage,
  validateImage as defaultValidateImage,
} from "../lib/api-client";
import { type FrontendFlowLogger, useLogging } from "../hooks/use-logging";
import { photoStore, type PhotoStore } from "../store/photo-store";
import type {
  ApiError,
  ApiResult,
  CropImageResponse,
  DownloadCroppedPhotoResponse,
  ProcessedPhoto,
  UploadImageRequest,
  UploadImageResponse,
  UploadedImage,
  ValidateImageResponse,
} from "../types/entities";

export type ValidationStatus = "error" | "failed" | "idle" | "passed" | "running";

export interface WorkflowNotice {
  message: string;
  title: string;
  tone: "error" | "success";
}

export interface PhotoEditorPageProps {
  cropImage?: typeof defaultCropImage;
  downloadCroppedPhoto?: typeof defaultDownloadCroppedPhoto;
  initialWorkflowError?: ApiError | null;
  initialWorkflowErrorOperation?: ErrorBannerOperation | null;
  initialImageUrl?: string | null;
  initialValidationStatus?: ValidationStatus;
  initialWorkflowNotice?: WorkflowNotice | null;
  logger?: FrontendFlowLogger;
  store?: StoreApi<PhotoStore>;
  uploadImage?: typeof defaultUploadImage;
  validateImage?: typeof defaultValidateImage;
}

export interface ExecuteUploadWorkflowOptions {
  logger?: FrontendFlowLogger;
  createObjectUrl?: (file: Blob) => string;
  request: UploadImageRequest;
  store: StoreApi<PhotoStore>;
  uploadImage: typeof defaultUploadImage;
  validateImage: typeof defaultValidateImage;
}

export interface ExecuteUploadWorkflowResult {
  error: ApiError | null;
  errorOperation: ErrorBannerOperation | null;
  imageUrl: string | null;
  notice: WorkflowNotice | null;
  uploadResult: ApiResult<UploadImageResponse>;
  validationStatus: ValidationStatus;
}

function findLatestProcessedPhoto(
  processedPhotos: ProcessedPhoto[],
  imageId: UploadedImage["id"] | null,
): ProcessedPhoto | null {
  if (imageId === null) {
    return null;
  }

  for (let index = processedPhotos.length - 1; index >= 0; index -= 1) {
    const processedPhoto = processedPhotos[index];

    if (processedPhoto?.uploaded_image_id === imageId) {
      return processedPhoto;
    }
  }

  return null;
}

function toDownloadFilename(filename: string): string {
  const extensionIndex = filename.lastIndexOf(".");

  if (extensionIndex <= 0) {
    return `${filename}-cropped.jpg`;
  }

  return `${filename.slice(0, extensionIndex)}-cropped${filename.slice(extensionIndex)}`;
}

export async function executeUploadWorkflow({
  createObjectUrl = URL.createObjectURL.bind(URL),
  logger,
  request,
  store,
  uploadImage,
  validateImage,
}: ExecuteUploadWorkflowOptions): Promise<ExecuteUploadWorkflowResult> {
  store.getState().clearValidationFailures();

  const uploadLogContext = logger?.startEvent({
    event: "upload",
    imageId: null,
    userId: request.user_id ?? null,
  });
  const uploadResult = await uploadImage(request);

  if (uploadLogContext !== undefined) {
    logger?.finishEvent(uploadLogContext, {
      errorCode: uploadResult.ok ? undefined : uploadResult.error.code,
      imageId: uploadResult.ok ? uploadResult.data.image.id : null,
      metadata: {
        filename: request.filename,
      },
      status: uploadResult.ok ? "succeeded" : "failed",
      userId: uploadResult.ok ? uploadResult.data.image.user_id : request.user_id ?? null,
    });
  }

  if (!uploadResult.ok) {
    return {
      error: null,
      errorOperation: null,
      imageUrl: null,
      notice: null,
      uploadResult,
      validationStatus: "idle",
    };
  }

  const imageUrl = createObjectUrl(request.file);
  const validateLogContext = logger?.startEvent({
    event: "validate",
    imageId: uploadResult.data.image.id,
    userId: uploadResult.data.image.user_id,
  });
  const validationResult: ApiResult<ValidateImageResponse> = await validateImage({
    image_id: uploadResult.data.image.id,
  });

  if (validateLogContext !== undefined) {
    logger?.finishEvent(validateLogContext, {
      errorCode: validationResult.ok ? undefined : validationResult.error.code,
      imageId: uploadResult.data.image.id,
      metadata: validationResult.ok
        ? {
            validation_failure_count: validationResult.data.validation_failures.length,
          }
        : undefined,
      status: validationResult.ok ? "succeeded" : "failed",
      userId: uploadResult.data.image.user_id,
    });
  }

  if (!validationResult.ok) {
    return {
      error: validationResult.error,
      errorOperation: "validation",
      imageUrl,
      notice: null,
      uploadResult,
      validationStatus: "error",
    };
  }

  validationResult.data.validation_failures.forEach((failure) => {
    store.getState().addValidationFailure(failure);
  });

  if (!validationResult.data.is_valid || validationResult.data.validation_failures.length > 0) {
    return {
      error: null,
      errorOperation: null,
      imageUrl,
      notice: null,
      uploadResult,
      validationStatus: "failed",
    };
  }

  return {
    error: null,
    errorOperation: null,
    imageUrl,
    notice: {
      message: "Image validated successfully. Continue to cropping.",
      title: "Validation complete",
      tone: "success",
    },
    uploadResult,
    validationStatus: "passed",
  };
}

function WorkflowBanner({ notice }: { notice: WorkflowNotice }): React.JSX.Element {
  const isSuccess = notice.tone === "success";

  return (
    <Alert
      aria-live={isSuccess ? "polite" : "assertive"}
      className={
        isSuccess
          ? "border-emerald-200 bg-emerald-50 text-emerald-950 [&>svg]:text-emerald-600"
          : undefined
      }
      role={isSuccess ? "status" : "alert"}
    >
      <AlertTitle>{notice.title}</AlertTitle>
      <AlertDescription>{notice.message}</AlertDescription>
    </Alert>
  );
}

export function PhotoEditorPage({
  cropImage = defaultCropImage,
  downloadCroppedPhoto = defaultDownloadCroppedPhoto,
  initialWorkflowError = null,
  initialWorkflowErrorOperation = null,
  initialImageUrl = null,
  initialValidationStatus = "idle",
  initialWorkflowNotice = null,
  logger,
  store = photoStore,
  uploadImage = defaultUploadImage,
  validateImage = defaultValidateImage,
}: PhotoEditorPageProps): React.JSX.Element {
  const defaultLogger = useLogging();
  const flowLogger = logger ?? defaultLogger;
  const images = React.useSyncExternalStore(
    store.subscribe,
    () => store.getState().images,
    () => store.getState().images,
  );
  const validations = React.useSyncExternalStore(
    store.subscribe,
    () => store.getState().validations,
    () => store.getState().validations,
  );
  const processedPhotos = React.useSyncExternalStore(
    store.subscribe,
    () => store.getState().processedPhotos,
    () => store.getState().processedPhotos,
  );
  const [currentImageUrl, setCurrentImageUrl] = React.useState<string | null>(initialImageUrl);
  const [validationStatus, setValidationStatus] =
    React.useState<ValidationStatus>(initialValidationStatus);
  const [workflowError, setWorkflowError] = React.useState<ApiError | null>(initialWorkflowError);
  const [workflowErrorOperation, setWorkflowErrorOperation] =
    React.useState<ErrorBannerOperation | null>(initialWorkflowErrorOperation);
  const [workflowNotice, setWorkflowNotice] =
    React.useState<WorkflowNotice | null>(initialWorkflowNotice);
  const managedImageUrlRef = React.useRef<string | null>(null);
  const currentImage = images[images.length - 1] ?? null;
  const currentProcessedPhoto = findLatestProcessedPhoto(
    processedPhotos,
    currentImage?.id ?? null,
  );
  const downloadFilename =
    currentImage === null ? undefined : toDownloadFilename(currentImage.filename);
  const showCropper = currentImage !== null && currentImageUrl !== null && validationStatus === "passed";

  const replaceManagedImageUrl = React.useCallback((nextImageUrl: string | null) => {
    setCurrentImageUrl((currentValue) => {
      const managedImageUrl = managedImageUrlRef.current;

      if (managedImageUrl !== null && managedImageUrl === currentValue) {
        URL.revokeObjectURL(managedImageUrl);
      }

      return nextImageUrl;
    });

    managedImageUrlRef.current = nextImageUrl;
  }, []);

  React.useEffect(() => {
    return () => {
      if (managedImageUrlRef.current !== null) {
        URL.revokeObjectURL(managedImageUrlRef.current);
      }
    };
  }, []);

  const handleUpload = React.useCallback(
    async (request: UploadImageRequest): Promise<ApiResult<UploadImageResponse>> => {
      setValidationStatus("running");
      setWorkflowError(null);
      setWorkflowErrorOperation(null);
      setWorkflowNotice(null);

      const workflowResult = await executeUploadWorkflow({
        logger: flowLogger,
        request,
        store,
        uploadImage,
        validateImage,
      });

      if (workflowResult.imageUrl !== null) {
        replaceManagedImageUrl(workflowResult.imageUrl);
      }

      setValidationStatus(workflowResult.validationStatus);
      setWorkflowError(workflowResult.error);
      setWorkflowErrorOperation(workflowResult.errorOperation);
      setWorkflowNotice(workflowResult.notice);

      return workflowResult.uploadResult;
    },
    [flowLogger, replaceManagedImageUrl, store, uploadImage, validateImage],
  );

  const handleCropImage = React.useCallback(
    async (request: Parameters<typeof defaultCropImage>[0]) => {
      const cropLogContext = flowLogger.startEvent({
        event: "crop",
        imageId: request.image_id,
        userId: currentImage?.user_id ?? null,
      });
      const cropResult = await cropImage(request);

      flowLogger.finishEvent(cropLogContext, {
        errorCode: cropResult.ok ? undefined : cropResult.error.code,
        imageId: request.image_id,
        metadata: cropResult.ok
          ? {
              processed_photo_id: cropResult.data.processed_photo.id,
            }
          : undefined,
        status: cropResult.ok ? "succeeded" : "failed",
        userId: currentImage?.user_id ?? null,
      });

      return cropResult;
    },
    [cropImage, currentImage?.user_id, flowLogger],
  );

  const handleCropConfirmed = React.useCallback((response: CropImageResponse) => {
    setWorkflowError(null);
    setWorkflowErrorOperation(null);
    setWorkflowNotice({
      message: `${response.processed_photo.id} is ready to download.`,
      title: "Crop complete",
      tone: "success",
    });
  }, []);

  const handleDownloadRequest = React.useCallback(
    async (request: Parameters<typeof defaultDownloadCroppedPhoto>[0]) => {
      const downloadLogContext = flowLogger.startEvent({
        event: "download",
        imageId: currentImage?.id ?? null,
        userId: currentImage?.user_id ?? null,
      });
      const downloadResult = await downloadCroppedPhoto(request);

      flowLogger.finishEvent(downloadLogContext, {
        errorCode: downloadResult.ok ? undefined : downloadResult.error.code,
        imageId: currentImage?.id ?? null,
        metadata: downloadResult.ok
          ? {
              filename: downloadResult.data.filename,
            }
          : undefined,
        status: downloadResult.ok ? "succeeded" : "failed",
        userId: currentImage?.user_id ?? null,
      });

      return downloadResult;
    },
    [currentImage?.id, currentImage?.user_id, downloadCroppedPhoto, flowLogger],
  );

  const handleDownloadComplete = React.useCallback((response: DownloadCroppedPhotoResponse) => {
    setWorkflowError(null);
    setWorkflowErrorOperation(null);
    setWorkflowNotice({
      message: `${response.filename} downloaded successfully.`,
      title: "Download complete",
      tone: "success",
    });
  }, []);

  return (
    <main
      aria-labelledby="photo-editor-title"
      className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8"
    >
      <a
        className="absolute left-4 top-4 -translate-y-16 rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
        href="#photo-editor-workflow"
      >
        Skip to photo editor workflow
      </a>

      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
          Hexagen Automate Photo Croping App
        </p>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight" id="photo-editor-title">
            Upload, validate, crop, and download a processed portrait
          </h1>
          <p className="max-w-3xl text-sm text-slate-600">
            This workflow validates each upload before cropping so users get clear feedback and a
            predictable download path.
          </p>
        </div>
      </header>

      {workflowError !== null && workflowErrorOperation !== null ? (
        <ErrorBanner error={workflowError} operation={workflowErrorOperation} />
      ) : workflowNotice !== null ? (
        <WorkflowBanner notice={workflowNotice} />
      ) : null}

      <section className="space-y-6" id="photo-editor-workflow">
        <UploadZone onCropChange={() => setWorkflowNotice(null)} store={store} uploadImage={handleUpload} />
        <ValidationBanner store={store} />
        {showCropper ? (
          <CropperPanel
            cropImage={handleCropImage}
            image={currentImage}
            imageUrl={currentImageUrl}
            onCropConfirmed={handleCropConfirmed}
            store={store}
          />
        ) : null}
        {currentProcessedPhoto !== null ? (
          <DownloadPanel
            downloadCroppedPhoto={handleDownloadRequest}
            filename={downloadFilename}
            onDownloadComplete={handleDownloadComplete}
            photo={currentProcessedPhoto}
          />
        ) : null}
      </section>
    </main>
  );
}

export default function Page(): React.JSX.Element {
  return <PhotoEditorPage />;
}
