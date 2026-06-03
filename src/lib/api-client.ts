import type {
  ApiError,
  ApiResult,
  CheckCroppingFeatureFlagResponse,
  CropImageRequest,
  CropImageResponse,
  DownloadCroppedPhotoRequest,
  DownloadCroppedPhotoResponse,
  GetImageStatusRequest,
  GetImageStatusResponse,
  UploadImageRequest,
  UploadImageResponse,
  ValidateImageRequest,
  ValidateImageResponse,
} from "../types/entities";

const DEFAULT_API_BASE_URL = "/api";

interface ApiClientOptions {
  baseUrl?: string;
  fetchFn?: typeof fetch;
}

interface ErrorPayloadShape {
  code?: unknown;
  details?: unknown;
  message?: unknown;
}

type JsonBody = Record<string, unknown>;

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

function buildUrl(baseUrl: string, path: string): string {
  return `${normalizeBaseUrl(baseUrl)}${path}`;
}

function isErrorPayloadShape(payload: unknown): payload is ErrorPayloadShape {
  return typeof payload === "object" && payload !== null;
}

function createErrorFromPayload(
  status: number,
  payload: unknown,
  fallbackCode: string,
  fallbackMessage: string,
): ApiError {
  if (isErrorPayloadShape(payload)) {
    return {
      code:
        typeof payload.code === "string" && payload.code.length > 0
          ? payload.code
          : fallbackCode,
      details: payload.details,
      message:
        typeof payload.message === "string" && payload.message.length > 0
          ? payload.message
          : fallbackMessage,
      status,
    };
  }

  if (typeof payload === "string" && payload.length > 0) {
    return {
      code: fallbackCode,
      details: payload,
      message: payload,
      status,
    };
  }

  return {
    code: fallbackCode,
    message: fallbackMessage,
    status,
  };
}

async function readResponsePayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text.length > 0 ? text : undefined;
}

async function performJsonRequest<T>(
  fetchFn: typeof fetch,
  url: string,
  init: RequestInit,
  errorCode: string,
): Promise<ApiResult<T>> {
  try {
    const response = await fetchFn(url, init);
    const payload = await readResponsePayload(response);

    if (!response.ok) {
      return {
        error: createErrorFromPayload(
          response.status,
          payload,
          errorCode,
          `Request failed with status ${response.status}`,
        ),
        ok: false,
        status: response.status,
      };
    }

    return {
      data: payload as T,
      ok: true,
      status: response.status,
    };
  } catch (error) {
    return {
      error: createErrorFromPayload(
        0,
        error instanceof Error ? error.message : error,
        "network_error",
        "Network request failed",
      ),
      ok: false,
      status: 0,
    };
  }
}

function parseDownloadFilename(
  response: Response,
  fallbackFilename: string,
): string {
  const contentDisposition = response.headers.get("content-disposition");
  const filenameMatch = contentDisposition?.match(/filename="?(?<filename>[^"]+)"?/i);
  return filenameMatch?.groups?.filename ?? fallbackFilename;
}

async function performDownloadRequest(
  fetchFn: typeof fetch,
  url: string,
  request: DownloadCroppedPhotoRequest,
): Promise<ApiResult<DownloadCroppedPhotoResponse>> {
  try {
    const response = await fetchFn(url, {
      method: "GET",
    });

    if (!response.ok) {
      const payload = await readResponsePayload(response);
      return {
        error: createErrorFromPayload(
          response.status,
          payload,
          "download_failed",
          `Request failed with status ${response.status}`,
        ),
        ok: false,
        status: response.status,
      };
    }

    return {
      data: {
        content_type: response.headers.get("content-type") ?? "application/octet-stream",
        file: await response.blob(),
        filename: parseDownloadFilename(response, `${request.photo_id}.bin`),
      },
      ok: true,
      status: response.status,
    };
  } catch (error) {
    return {
      error: createErrorFromPayload(
        0,
        error instanceof Error ? error.message : error,
        "network_error",
        "Network request failed",
      ),
      ok: false,
      status: 0,
    };
  }
}

function createJsonRequestInit(method: "GET" | "POST", body?: JsonBody): RequestInit {
  return {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
    method,
  };
}

function createUploadRequestInit(request: UploadImageRequest): RequestInit {
  const formData = new FormData();

  formData.append("file", request.file, request.filename);

  if (request.user_id !== undefined) {
    formData.append("user_id", request.user_id ?? "");
  }

  return {
    body: formData,
    method: "POST",
  };
}

export function createApiClient(options: ApiClientOptions = {}) {
  const baseUrl = options.baseUrl ?? DEFAULT_API_BASE_URL;
  const fetchFn = options.fetchFn ?? fetch;

  return {
    uploadImage: (request: UploadImageRequest): Promise<ApiResult<UploadImageResponse>> =>
      performJsonRequest<UploadImageResponse>(
        fetchFn,
        buildUrl(baseUrl, "/images/upload"),
        createUploadRequestInit(request),
        "upload_failed",
      ),
    validateImage: (
      request: ValidateImageRequest,
    ): Promise<ApiResult<ValidateImageResponse>> =>
      performJsonRequest<ValidateImageResponse>(
        fetchFn,
        buildUrl(baseUrl, `/images/${request.image_id}/validate`),
        createJsonRequestInit("POST"),
        "validation_failed",
      ),
    cropImage: (request: CropImageRequest): Promise<ApiResult<CropImageResponse>> =>
      performJsonRequest<CropImageResponse>(
        fetchFn,
        buildUrl(baseUrl, `/images/${request.image_id}/crop`),
        createJsonRequestInit("POST", {
          crop_metadata: request.crop_metadata,
        }),
        "crop_failed",
      ),
    downloadCroppedPhoto: (
      request: DownloadCroppedPhotoRequest,
    ): Promise<ApiResult<DownloadCroppedPhotoResponse>> =>
      performDownloadRequest(
        fetchFn,
        buildUrl(baseUrl, `/photos/${request.photo_id}/download`),
        request,
      ),
    getImageStatus: (
      request: GetImageStatusRequest,
    ): Promise<ApiResult<GetImageStatusResponse>> =>
      performJsonRequest<GetImageStatusResponse>(
        fetchFn,
        buildUrl(baseUrl, `/images/${request.image_id}/status`),
        createJsonRequestInit("GET"),
        "status_fetch_failed",
      ),
    checkCroppingFeatureFlag: (): Promise<
      ApiResult<CheckCroppingFeatureFlagResponse>
    > =>
      performJsonRequest<CheckCroppingFeatureFlagResponse>(
        fetchFn,
        buildUrl(baseUrl, "/feature-flags/cropping"),
        createJsonRequestInit("GET"),
        "feature_flag_check_failed",
      ),
  };
}

const defaultApiClient = createApiClient();

export const uploadImage = defaultApiClient.uploadImage;
export const validateImage = defaultApiClient.validateImage;
export const cropImage = defaultApiClient.cropImage;
export const downloadCroppedPhoto = defaultApiClient.downloadCroppedPhoto;
export const getImageStatus = defaultApiClient.getImageStatus;
export const checkCroppingFeatureFlag = defaultApiClient.checkCroppingFeatureFlag;
