import * as React from "react";

export type FrontendFlowEvent = "crop" | "download" | "upload" | "validate";
export type FrontendFlowStatus = "failed" | "succeeded";

export interface FrontendFlowLogContext {
  event: FrontendFlowEvent;
  imageId: string | null;
  requestId: string;
  startedAt: number;
  userId: string | null;
}

export interface FrontendFlowLogEntry {
  event: FrontendFlowEvent;
  image_id: string | null;
  logged_at: string;
  processing_duration_ms: number;
  request_id: string;
  status: FrontendFlowStatus;
  user_id: string | null;
  error_code?: string;
  metadata?: Record<string, unknown>;
}

export interface FrontendFlowLogCompletion {
  errorCode?: string;
  imageId?: string | null;
  metadata?: Record<string, unknown>;
  status: FrontendFlowStatus;
  userId?: string | null;
}

export interface UseLoggingOptions {
  logger?: Pick<Console, "info">;
  now?: () => number;
  requestIdFactory?: () => string;
  timestampFactory?: () => string;
}

export interface FrontendFlowLogger {
  finishEvent: (
    context: FrontendFlowLogContext,
    completion: FrontendFlowLogCompletion,
  ) => FrontendFlowLogEntry;
  startEvent: (event: {
    event: FrontendFlowEvent;
    imageId: string | null;
    requestId?: string;
    userId: string | null;
  }) => FrontendFlowLogContext;
}

const REDACTED_USER_ID = "redacted";
const REDACTED_USER_IDS = new Set(["anonymous", "demo"]);
const BINARY_METADATA_KEYS = new Set([
  "base64",
  "binary",
  "blob",
  "buffer",
  "bytes",
  "data_url",
  "file",
  "image_data",
]);

function defaultNow(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function defaultTimestampFactory(): string {
  return new Date().toISOString();
}

function defaultRequestIdFactory(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `request-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function redactUserId(userId: string | null | undefined): string | null {
  if (userId === null || userId === undefined) {
    return null;
  }

  const normalizedUserId = userId.trim().toLowerCase();

  if (normalizedUserId.length === 0) {
    return null;
  }

  return REDACTED_USER_IDS.has(normalizedUserId) ? REDACTED_USER_ID : userId;
}

function isBinaryValue(value: unknown): boolean {
  if (typeof Blob !== "undefined" && value instanceof Blob) {
    return true;
  }

  if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
    return true;
  }

  return false;
}

function sanitizeMetadataValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (isBinaryValue(value)) {
    return undefined;
  }

  if (Array.isArray(value)) {
    const sanitizedValues = value
      .map((entry) => sanitizeMetadataValue(entry))
      .filter((entry) => entry !== undefined);

    return sanitizedValues;
  }

  if (typeof value === "object") {
    const sanitizedEntries = Object.entries(value).reduce<Record<string, unknown>>(
      (entries, [key, entryValue]) => {
        if (BINARY_METADATA_KEYS.has(key)) {
          return entries;
        }

        const sanitizedValue = sanitizeMetadataValue(entryValue);

        if (sanitizedValue !== undefined) {
          entries[key] = sanitizedValue;
        }

        return entries;
      },
      {},
    );

    return Object.keys(sanitizedEntries).length > 0 ? sanitizedEntries : undefined;
  }

  return value;
}

export function sanitizeLogMetadata(
  metadata: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (metadata === undefined) {
    return undefined;
  }

  const sanitizedMetadata = sanitizeMetadataValue(metadata);
  return sanitizedMetadata !== undefined &&
    typeof sanitizedMetadata === "object" &&
    sanitizedMetadata !== null &&
    !Array.isArray(sanitizedMetadata)
    ? (sanitizedMetadata as Record<string, unknown>)
    : undefined;
}

export function createFrontendFlowLogEntry({
  completion,
  context,
  now,
  timestampFactory,
}: {
  completion: FrontendFlowLogCompletion;
  context: FrontendFlowLogContext;
  now: () => number;
  timestampFactory: () => string;
}): FrontendFlowLogEntry {
  const imageId = completion.imageId ?? context.imageId;
  const metadata = sanitizeLogMetadata(completion.metadata);
  const userId = completion.userId ?? context.userId;

  return {
    ...(completion.errorCode === undefined ? {} : { error_code: completion.errorCode }),
    ...(metadata === undefined ? {} : { metadata }),
    event: context.event,
    image_id: imageId,
    logged_at: timestampFactory(),
    processing_duration_ms: Math.max(0, now() - context.startedAt),
    request_id: context.requestId,
    status: completion.status,
    user_id: redactUserId(userId),
  };
}

export function createLogging(options: UseLoggingOptions = {}): FrontendFlowLogger {
  const logger = options.logger ?? console;
  const now = options.now ?? defaultNow;
  const requestIdFactory = options.requestIdFactory ?? defaultRequestIdFactory;
  const timestampFactory = options.timestampFactory ?? defaultTimestampFactory;

  return {
    finishEvent: (context, completion) => {
      const entry = createFrontendFlowLogEntry({
        completion,
        context,
        now,
        timestampFactory,
      });

      logger.info(JSON.stringify(entry));
      return entry;
    },
    startEvent: ({ event, imageId, requestId, userId }) => ({
      event,
      imageId,
      requestId: requestId ?? requestIdFactory(),
      startedAt: now(),
      userId,
    }),
  };
}

export function useLogging(options: UseLoggingOptions = {}): FrontendFlowLogger {
  const loggingRef = React.useRef<FrontendFlowLogger | null>(null);

  if (loggingRef.current === null) {
    loggingRef.current = createLogging(options);
  }

  return loggingRef.current;
}
