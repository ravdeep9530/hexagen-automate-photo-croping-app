import type {
  ApiClientError,
  ApiClientResult,
  CropImageRequest,
  CropImageResponse,
  CroppingFeatureFlagResponse,
  DownloadCroppedPhotoRequest,
  DownloadCroppedPhotoResponse,
  GetImageStatusRequest,
  GetImageStatusResponse,
  UploadImageRequest,
  UploadImageResponse,
  ValidateImageRequest,
  ValidateImageResponse,
} from "../types/entities";

type FetchLike = typeof fetch;

export interface ApiClientOptions {
  baseUrl?: string;
  fetchFn?: FetchLike;
}

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

const createNetworkError = (error: unknown): ApiClientError => ({
  status: 0,
  code: "network_error",
  message: error instanceof Error ? error.message : "Network request failed.",
  details: error,
});

const getFetch = (): FetchLike => {
  if (typeof fetch !== "function") {
    throw new Error("Fetch API is not available.");
  }

  return fetch.bind(globalThis);
};

const normalizeBaseUrl = (baseUrl: string): string => baseUrl.replace(/\/+$/, "");

const buildUrl = (baseUrl: string, path: string): string => `${normalizeBaseUrl(baseUrl)}${path}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const extractErrorShape = (
  payload: unknown,
): {
  code?: string;
  message?: string;
  details?: unknown;
} => {
  if (!isRecord(payload)) {
    return {};
  }

  const source = isRecord(payload.error) ? payload.error : payload;

  return {
    code: typeof source.code === "string" ? source.code : undefined,
    message: typeof source.message === "string" ? source.message : undefined,
    details: "details" in source ? source.details : undefined,
  };
};

const createApiError = (
  response: Response,
  payload: unknown,
  fallbackMessage: string,
): ApiClientError => {
  const errorShape = extractErrorShape(payload);

  return {
    status: response.status,
    code: errorShape.code ?? `http_${response.status}`,
    message: errorShape.message ?? (response.statusText || fallbackMessage),
    details: errorShape.details,
  };
};

const parseJsonPayload = async (response: Response): Promise<unknown> => {
  if (response.status === 204 || response.status === 205) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    const text = await response.text();
    return text ? { message: text } : null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
};

const requestJson = async <T>(
  fetchFn: FetchLike,
  url: string,
  init: RequestInit,
  fallbackMessage: string,
): Promise<ApiClientResult<T>> => {
  try {
    const response = await fetchFn(url, init);
    const payload = await parseJsonPayload(response);

    if (!response.ok) {
      return {
        data: null,
        error: createApiError(response, payload, fallbackMessage),
      };
    }

    return {
      data: payload as T,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: createNetworkError(error),
    };
  }
};

const parseFilename = (contentDisposition: string | null): string | null => {
  if (!contentDisposition) {
    return null;
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);

  if (utf8Match) {
    return decodeURIComponent(utf8Match[1]);
  }

  const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return filenameMatch?.[1] ?? null;
};

export const createApiClient = (options: ApiClientOptions = {}) => {
  const baseUrl = options.baseUrl ?? "";
  const fetchFn = options.fetchFn ?? getFetch();

  return {
    uploadImage: async (request: UploadImageRequest): Promise<ApiClientResult<UploadImageResponse>> => {
      const formData = new FormData();

      formData.append("file", request.file, request.filename);

      if (request.userId !== undefined) {
        formData.append("userId", request.userId ?? "");
      }

      return requestJson<UploadImageResponse>(
        fetchFn,
        buildUrl(baseUrl, "/api/images/upload"),
        {
          method: "POST",
          body: formData,
        },
        "Unable to upload image.",
      );
    },
    validateImage: async (
      request: ValidateImageRequest,
    ): Promise<ApiClientResult<ValidateImageResponse>> =>
      requestJson<ValidateImageResponse>(
        fetchFn,
        buildUrl(baseUrl, `/api/images/${encodeURIComponent(request.imageId)}/validate`),
        {
          method: "POST",
        },
        "Unable to validate image.",
      ),
    cropImage: async (request: CropImageRequest): Promise<ApiClientResult<CropImageResponse>> =>
      requestJson<CropImageResponse>(
        fetchFn,
        buildUrl(baseUrl, `/api/images/${encodeURIComponent(request.imageId)}/crop`),
        {
          method: "POST",
          headers: JSON_HEADERS,
          body: JSON.stringify(request.crop),
        },
        "Unable to crop image.",
      ),
    downloadCroppedPhoto: async (
      request: DownloadCroppedPhotoRequest,
    ): Promise<ApiClientResult<DownloadCroppedPhotoResponse>> => {
      try {
        const response = await fetchFn(
          buildUrl(baseUrl, `/api/photos/${encodeURIComponent(request.photoId)}/download`),
          {
            method: "GET",
          },
        );

        if (!response.ok) {
          const payload = await parseJsonPayload(response);

          return {
            data: null,
            error: createApiError(response, payload, "Unable to download cropped photo."),
          };
        }

        const blob = await response.blob();

        return {
          data: {
            photoId: request.photoId,
            filename: parseFilename(response.headers.get("content-disposition")),
            contentType: response.headers.get("content-type"),
            blob,
          },
          error: null,
        };
      } catch (error) {
        return {
          data: null,
          error: createNetworkError(error),
        };
      }
    },
    getImageStatus: async (
      request: GetImageStatusRequest,
    ): Promise<ApiClientResult<GetImageStatusResponse>> =>
      requestJson<GetImageStatusResponse>(
        fetchFn,
        buildUrl(baseUrl, `/api/images/${encodeURIComponent(request.imageId)}/status`),
        {
          method: "GET",
        },
        "Unable to fetch image status.",
      ),
    checkCroppingFeatureFlag: async (): Promise<ApiClientResult<CroppingFeatureFlagResponse>> =>
      requestJson<CroppingFeatureFlagResponse>(
        fetchFn,
        buildUrl(baseUrl, "/api/feature-flags/cropping"),
        {
          method: "GET",
        },
        "Unable to fetch cropping feature flag.",
      ),
  };
};

const apiClient = createApiClient();

export const uploadImage = apiClient.uploadImage;
export const validateImage = apiClient.validateImage;
export const cropImage = apiClient.cropImage;
export const downloadCroppedPhoto = apiClient.downloadCroppedPhoto;
export const getImageStatus = apiClient.getImageStatus;
export const checkCroppingFeatureFlag = apiClient.checkCroppingFeatureFlag;
