const FALLBACK_ERROR_MESSAGE = 'Something went wrong. Please try again.';
const LIVE_REGION_ID = 'app-error-live-region';

export class ApiRouteError extends Error {
  status: number;
  code: string;
  details?: string | null;

  constructor(status: number, code: string, message: string, details?: string | null) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function createApiError(status: number, code: string, message: string, details?: string | null): ApiRouteError {
  return new ApiRouteError(status, code, message, details);
}

export function formatApiErrorResponse(error: ApiRouteError): { error: { code: string; message: string; details?: string | null } } {
  return {
    error: {
      code: error.code,
      message: error.message,
      ...(error.details !== undefined ? { details: error.details } : {}),
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getStringFromUnknown(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return null;
}

function extractMessage(value: unknown): string | null {
  const direct = getStringFromUnknown(value);
  if (direct) {
    return direct;
  }

  if (value instanceof Error) {
    return getStringFromUnknown(value.message);
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = extractMessage(item);
      if (nested) {
        return nested;
      }
    }

    return null;
  }

  if (!isRecord(value)) {
    return null;
  }

  const preferredKeys = ['message', 'error', 'detail', 'title', 'reason'];
  for (const key of preferredKeys) {
    const nested = extractMessage(value[key]);
    if (nested) {
      return nested;
    }
  }

  if ('errors' in value) {
    const nested = extractMessage(value.errors);
    if (nested) {
      return nested;
    }
  }

  return null;
}

function mapStatusToMessage(status: unknown): string | null {
  if (typeof status !== 'number' || !Number.isFinite(status)) {
    return null;
  }

  if (status === 400) return 'The request was invalid. Please check your input and try again.';
  if (status === 401) return 'You need to sign in to continue.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return 'The requested resource could not be found.';
  if (status === 408) return 'The request timed out. Please try again.';
  if (status === 409) return 'This action could not be completed due to a conflict. Please try again.';
  if (status === 413) return 'The uploaded file is too large.';
  if (status === 415) return 'This file type is not supported.';
  if (status === 422) return 'Some information is invalid. Please review your input and try again.';
  if (status === 429) return 'Too many requests. Please wait a moment and try again.';
  if (status >= 500) return 'A server error occurred. Please try again shortly.';
  if (status >= 400) return 'We could not complete your request. Please try again.';

  return null;
}

export function mapApiErrorToMessage(error: any): string {
  const extracted = extractMessage(error);
  if (extracted) {
    return extracted;
  }

  if (isRecord(error)) {
    const statusMessage = mapStatusToMessage(error.status);
    if (statusMessage) {
      return statusMessage;
    }

    if ('response' in error && isRecord(error.response)) {
      const nestedMessage = extractMessage(error.response);
      if (nestedMessage) {
        return nestedMessage;
      }

      const responseStatusMessage = mapStatusToMessage(error.response.status);
      if (responseStatusMessage) {
        return responseStatusMessage;
      }
    }
  }

  return FALLBACK_ERROR_MESSAGE;
}

export function announceError(message: string): void {
  if (typeof document === 'undefined') {
    return;
  }

  const normalizedMessage = message.trim();
  if (!normalizedMessage) {
    return;
  }

  let liveRegion = document.getElementById(LIVE_REGION_ID);

  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = LIVE_REGION_ID;
    liveRegion.setAttribute('role', 'alert');
    liveRegion.setAttribute('aria-live', 'assertive');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.position = 'absolute';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.padding = '0';
    liveRegion.style.margin = '-1px';
    liveRegion.style.overflow = 'hidden';
    liveRegion.style.clip = 'rect(0, 0, 0, 0)';
    liveRegion.style.whiteSpace = 'nowrap';
    liveRegion.style.border = '0';
    document.body.appendChild(liveRegion);
  }

  liveRegion.textContent = '';

  window.setTimeout(() => {
    const currentRegion = document.getElementById(LIVE_REGION_ID);
    if (currentRegion) {
      currentRegion.textContent = normalizedMessage;
    }
  }, 0);
}
