export type ApiErrorCode =
  | 'UNSUPPORTED_QUERY_PARAMETER'
  | 'UNSUPPORTED_FILTER_VALUE'
  | 'CATALOG_VALIDATION_FAILED';

export interface ApiErrorPayload {
  error: {
    code: ApiErrorCode;
    message: string;
    field?: string;
    value?: string;
  };
}

const IMAGE_PAYLOAD_PARAM_NAMES = new Set([
  'image',
  'imageBlob',
  'blob',
  'file',
  'photo',
  'base64',
  'dataUri',
  'imageUrl',
  'remoteImageUrl',
  'url',
]);

export function apiError(
  code: ApiErrorCode,
  message: string,
  init?: { field?: string; value?: string }
): ApiErrorPayload {
  return {
    error: {
      code,
      message,
      ...(init?.field ? { field: init.field } : {}),
      ...(init?.value ? { value: init.value } : {}),
    },
  };
}

export function validateAllowedSearchParams(
  searchParams: URLSearchParams,
  allowedParams: readonly string[]
): ApiErrorPayload | undefined {
  const allowed = new Set(allowedParams);

  for (const paramName of searchParams.keys()) {
    if (IMAGE_PAYLOAD_PARAM_NAMES.has(paramName) || !allowed.has(paramName)) {
      return apiError(
        'UNSUPPORTED_QUERY_PARAMETER',
        `Unsupported query parameter: ${paramName}. These static metadata endpoints do not accept image payloads, base64 data, remote image URLs, or arbitrary filters.`,
        { field: paramName }
      );
    }
  }

  return undefined;
}

export function validateFilterValue(
  field: string,
  value: string | null,
  supportedValues: ReadonlySet<string>,
  options: { normalize?: (value: string) => string } = {}
): { value?: string; error?: ApiErrorPayload } {
  if (value === null || value === '') {
    return {};
  }

  const normalizedValue = options.normalize ? options.normalize(value) : value;
  if (!supportedValues.has(normalizedValue)) {
    return {
      error: apiError(
        'UNSUPPORTED_FILTER_VALUE',
        `Unsupported ${field} value: ${value}.`,
        { field, value }
      ),
    };
  }

  return { value: normalizedValue };
}
