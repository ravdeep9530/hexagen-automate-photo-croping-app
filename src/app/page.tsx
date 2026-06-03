"use client";

import { CheckCircle2 } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { CropperPanel } from "../components/editor/cropper-panel";
import { DownloadPanel } from "../components/editor/download-panel";
import { ErrorBanner } from "../components/editor/error-banner";
import { UploadZone } from "../components/editor/upload-zone";
import { ValidationBanner } from "../components/editor/validation-banner";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import {
  checkCroppingFeatureFlag as defaultCheckCroppingFeatureFlag,
  cropImage as defaultCropImage,
  downloadCroppedPhoto as defaultDownloadCroppedPhoto,
  uploadImage as defaultUploadImage,
  validateImage as defaultValidateImage,
} from "../lib/api-client";
import { photoStore, type PhotoStore } from "../store/photo-store";
import type {
  ApiClientError,
  ApiClientResult,
  CropImageResponse,
  CropMetaData,
  CroppingFeatureFlagResponse,
  DownloadCroppedPhotoResponse,
  UploadImageResponse,
  ValidateImageResponse,
} from "../types/entities";

interface WorkflowBannerState {
  tone: "success";
  title: string;
  message: string;
}

interface WorkflowErrorState {
  kind: "upload" | "validation" | "crop" | "download";
  error: ApiClientError;
}

export interface PageApiClient {
  uploadImage: (request: {
    file: Blob;
    filename: string;
    userId?: string | null;
  }) => Promise<ApiClientResult<UploadImageResponse>>;
  validateImage: (request: { imageId: string }) => Promise<ApiClientResult<ValidateImageResponse>>;
  cropImage: (request: {
    imageId: string;
    crop: CropMetaData;
  }) => Promise<ApiClientResult<CropImageResponse>>;
  downloadCroppedPhoto: (request: {
    photoId: string;
  }) => Promise<ApiClientResult<DownloadCroppedPhotoResponse>>;
  checkCroppingFeatureFlag: (
    userId?: string | null,
  ) => Promise<ApiClientResult<CroppingFeatureFlagResponse>>;
}

export interface PhotoEditorPageProps {
  store?: PhotoStore;
  apiClient?: PageApiClient;
  userId?: string | null;
}

const defaultApiClient: PageApiClient = {
  uploadImage: defaultUploadImage,
  validateImage: defaultValidateImage,
  cropImage: defaultCropImage,
  downloadCroppedPhoto: defaultDownloadCroppedPhoto,
  checkCroppingFeatureFlag: defaultCheckCroppingFeatureFlag,
};

const getValidationSummary = (failureCount: number): string =>
  failureCount === 1
    ? "1 validation issue needs attention."
    : `${failureCount} validation issues need attention.`;

export const PhotoEditorPage = ({
  store = photoStore,
  apiClient = defaultApiClient,
  userId = null,
}: PhotoEditorPageProps) => {
  const headingId = useId();
  const statusId = useId();
  const workflowId = useId();
  const previewUrlsRef = useRef<Record<string, string>>({});
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [workflowBanner, setWorkflowBanner] = useState<WorkflowBannerState | null>(null);
  const [workflowError, setWorkflowError] = useState<WorkflowErrorState | null>(null);
  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);

  useEffect(() => {
    previewUrlsRef.current = previewUrls;
  }, [previewUrls]);

  useEffect(
    () => () => {
      Object.values(previewUrlsRef.current).forEach((previewUrl) => {
        URL.revokeObjectURL(previewUrl);
      });
    },
    [],
  );

  const activeImage = useMemo(() => {
    if (selectedImageId) {
      return state.images.find((image) => image.id === selectedImageId) ?? state.images.at(-1) ?? null;
    }

    return state.images.at(-1) ?? null;
  }, [selectedImageId, state.images]);

  const activePhoto = useMemo(() => {
    if (selectedPhotoId) {
      return (
        state.processedPhotos.find((photo) => photo.id === selectedPhotoId) ??
        state.processedPhotos.at(-1) ??
        null
      );
    }

    return state.processedPhotos.at(-1) ?? null;
  }, [selectedPhotoId, state.processedPhotos]);

  const activeImageUrl = activeImage ? previewUrls[activeImage.id] ?? null : null;

  const uploadZoneApiClient = useMemo(
    () => ({
      uploadImage: async (request: {
        file: Blob;
        filename: string;
        userId?: string | null;
      }): Promise<ApiClientResult<UploadImageResponse>> => {
        const result = await apiClient.uploadImage(request);

        if (result.error) {
          setWorkflowBanner(null);
          setWorkflowError({
            kind: "upload",
            error: result.error,
          });
          return result;
        }

        setWorkflowError(null);
        const previewUrl = URL.createObjectURL(request.file);

        setPreviewUrls((current) => {
          const previousUrl = current[result.data.image.id];

          if (previousUrl) {
            URL.revokeObjectURL(previousUrl);
          }

          return {
            ...current,
            [result.data.image.id]: previewUrl,
          };
        });

        return result;
      },
    }),
    [apiClient],
  );

  const cropperPanelApiClient = useMemo(
    () => ({
      cropImage: async (request: { imageId: string; crop: CropMetaData }) => {
        const result = await apiClient.cropImage(request);

        if (result.error) {
          setWorkflowBanner(null);
          setWorkflowError({ kind: "crop", error: result.error });
          return result;
        }

        setWorkflowError(null);
        return result;
      },
      checkCroppingFeatureFlag: apiClient.checkCroppingFeatureFlag,
    }),
    [apiClient],
  );

  const downloadPanelApiClient = useMemo(
    () => ({
      downloadCroppedPhoto: async (request: { photoId: string }) => {
        const result = await apiClient.downloadCroppedPhoto(request);

        if (result.error) {
          setWorkflowBanner(null);
          setWorkflowError({ kind: "download", error: result.error });
          return result;
        }

        setWorkflowError(null);
        return result;
      },
    }),
    [apiClient],
  );

  const handleImageUploaded = async (imageId: string) => {
    setSelectedImageId(imageId);
    setSelectedPhotoId(null);
    setWorkflowError(null);
    setWorkflowBanner({
      tone: "success",
      title: "Upload complete",
      message: "Image uploaded. Running validation checks now.",
    });

    const result = await apiClient.validateImage({ imageId });

    if (result.error) {
      store.getState().addValidationFailure({
        imageId,
        code: result.error.code,
        message: result.error.message,
      });
      setWorkflowBanner(null);
      setWorkflowError({
        kind: "validation",
        error: result.error,
      });
      return;
    }

    if (!result.data.isValid) {
      result.data.failures.forEach((failure) => {
        store.getState().addValidationFailure(failure);
      });
      setWorkflowBanner(null);
      setWorkflowError({
        kind: "validation",
        error: {
          status: 400,
          code: "validation_failed",
          message: getValidationSummary(result.data.failures.length),
        },
      });
      return;
    }

    setWorkflowError(null);
    setWorkflowBanner({
      tone: "success",
      title: "Image ready",
      message: `${result.data.image.filename} is ready for cropping.`,
    });
  };

  return (
    <main
      aria-labelledby={headingId}
      className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 px-4 py-10 sm:px-6 lg:px-8"
    >
      <a
        href={`#${workflowId}`}
        className="sr-only rounded-md bg-background px-3 py-2 text-sm font-medium text-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Skip to photo workflow
      </a>

      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Automated photo cropping
          </p>
          <h1 id={headingId} className="text-3xl font-semibold tracking-tight text-foreground">
            Upload, validate, crop, and download from one workflow.
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Each step announces status updates, preserves keyboard access, and keeps validation
            feedback visible until the issue is resolved.
          </p>
        </header>

        <div id={statusId} aria-live="polite" aria-atomic="true">
          {workflowBanner ? (
            <Alert className="border-emerald-500/60 bg-emerald-500/10 text-emerald-700">
              <div className="flex items-start gap-3">
                <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <AlertTitle>{workflowBanner.title}</AlertTitle>
                  <AlertDescription>{workflowBanner.message}</AlertDescription>
                </div>
              </div>
            </Alert>
          ) : null}
        </div>

        <ErrorBanner error={workflowError?.error ?? null} kind={workflowError?.kind ?? "upload"} />

        <section
          id={workflowId}
          aria-label="Photo cropping workflow"
          aria-describedby={statusId}
          className="grid gap-6"
        >
          <UploadZone
            store={store}
            apiClient={uploadZoneApiClient}
            userId={userId}
            onUploaded={(imageId) => {
              void handleImageUploaded(imageId);
            }}
          />
          <ValidationBanner store={store} />
          {activeImage && activeImageUrl ? (
            <CropperPanel
              image={activeImage}
              imageUrl={activeImageUrl}
              store={store}
              apiClient={cropperPanelApiClient}
              onCropConfirmed={(photoId) => {
                setSelectedPhotoId(photoId);
                setWorkflowError(null);
                setWorkflowBanner({
                  tone: "success",
                  title: "Crop complete",
                  message: "Processed photo is ready to download.",
                });
              }}
            />
          ) : null}
          {activePhoto ? (
            <DownloadPanel
              photo={activePhoto}
              apiClient={downloadPanelApiClient}
              onDownloaded={(_photoId, filename) => {
                setWorkflowError(null);
                setWorkflowBanner({
                  tone: "success",
                  title: "Download started",
                  message: `${filename} is downloading.`,
                });
              }}
            />
          ) : null}
        </section>
      </div>
    </main>
  );
};

export default PhotoEditorPage;
