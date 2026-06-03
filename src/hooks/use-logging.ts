import { useMemo } from "react";

export type FrontendFlowEventName = "upload" | "validate" | "crop" | "download";
export type FrontendFlowEventStatus = "success" | "error" | "invalid";

export interface FrontendFlowLogEvent {
  event: FrontendFlowEventName;
  status: FrontendFlowEventStatus;
  request_id: string;
  user_id: string | null;
  image_id: string | null;
  processing_duration_ms: number;
  metadata?: Record<string, unknown>;
}

export interface FrontendFlowLoggerOptions {
  userId?: string | null;
  logger?: (event: FrontendFlowLogEvent) => void;
  now?: () => number;
  createRequestId?: () => string;
}

export interface LogFrontendFlowInput {
  event: FrontendFlowEventName;
  status: FrontendFlowEventStatus;
  requestId?: string;
  userId?: string | null;
  imageId?: string | null;
  startedAt?: number;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

interface FrontendFlowLogger {
  createRequestId: () => string;
  getDurationMs: (startedAt: number) => number;
  logFlowEvent: (input: LogFrontendFlowInput) => FrontendFlowLogEvent;
}

const REDACTED_USER_ID = "redacted";
const BINARY_FIELD_NAMES = new Set(["blob", "file", "binarydata", "imagedata"]);

const defaultLogger = (event: FrontendFlowLogEvent) => {
  console.info("frontend_flow", event);
};

const normalizeKey = (key: string): string => key.replace(/[^a-z0-9]/gi, "").toLowerCase();

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && Object.getPrototypeOf(value) === Object.prototype;

const isBinaryValue = (value: unknown): boolean =>
  value instanceof Blob || value instanceof ArrayBuffer || ArrayBuffer.isView(value);

const sanitizeLogValue = (value: unknown, key?: string): unknown => {
  if (key && BINARY_FIELD_NAMES.has(normalizeKey(key))) {
    return undefined;
  }

  if (isBinaryValue(value)) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => sanitizeLogValue(entry))
      .filter((entry) => entry !== undefined);
  }

  if (isPlainObject(value)) {
    const sanitizedEntries = Object.entries(value).flatMap(([entryKey, entryValue]) => {
      const sanitizedValue = sanitizeLogValue(entryValue, entryKey);

      return sanitizedValue === undefined ? [] : [[entryKey, sanitizedValue] as const];
    });

    return sanitizedEntries.length > 0 ? Object.fromEntries(sanitizedEntries) : undefined;
  }

  return value;
};

const sanitizeMetadata = (
  metadata?: Record<string, unknown>,
): Record<string, unknown> | undefined => {
  if (!metadata) {
    return undefined;
  }

  const sanitizedEntries = Object.entries(metadata).flatMap(([key, value]) => {
    const sanitizedValue = sanitizeLogValue(value, key);

    return sanitizedValue === undefined ? [] : [[key, sanitizedValue] as const];
  });

  return sanitizedEntries.length > 0 ? Object.fromEntries(sanitizedEntries) : undefined;
};

export const redactUserId = (userId?: string | null): string | null => {
  if (userId == null) {
    return null;
  }

  const normalizedUserId = userId.trim().toLowerCase();

  if (!normalizedUserId) {
    return null;
  }

  if (normalizedUserId === "anonymous" || normalizedUserId === "demo") {
    return REDACTED_USER_ID;
  }

  return userId;
};

export const createFlowRequestId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `request-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const createFrontendFlowLogger = (
  options: FrontendFlowLoggerOptions = {},
): FrontendFlowLogger => {
  const now = options.now ?? (() => Date.now());
  const logger = options.logger ?? defaultLogger;
  const createRequestId = options.createRequestId ?? createFlowRequestId;

  return {
    createRequestId,
    getDurationMs: (startedAt) => Math.max(0, Math.round(now() - startedAt)),
    logFlowEvent: ({
      event,
      status,
      requestId,
      userId,
      imageId,
      startedAt,
      durationMs,
      metadata,
    }) => {
      const payload: FrontendFlowLogEvent = {
        event,
        status,
        request_id: requestId ?? createRequestId(),
        user_id: redactUserId(userId ?? options.userId),
        image_id: imageId ?? null,
        processing_duration_ms:
          durationMs ?? (startedAt === undefined ? 0 : Math.max(0, Math.round(now() - startedAt))),
        metadata: sanitizeMetadata(metadata),
      };

      if (!payload.metadata) {
        delete payload.metadata;
      }

      logger(payload);
      return payload;
    },
  };
};

export const useLogging = (options: FrontendFlowLoggerOptions = {}): FrontendFlowLogger =>
  useMemo(
    () => createFrontendFlowLogger(options),
    [options.createRequestId, options.logger, options.now, options.userId],
  );
