export type AiErrorCode =
  | 'client-only'
  | 'missing-image'
  | 'cancelled'
  | 'library-load-failed'
  | 'processing-failed';

export class AiProcessingError extends Error {
  readonly code: AiErrorCode;
  readonly cause?: unknown;
  readonly actionableMessage: string;

  constructor(code: AiErrorCode, message: string, actionableMessage: string, cause?: unknown) {
    super(message);
    this.name = 'AiProcessingError';
    this.code = code;
    this.cause = cause;
    this.actionableMessage = actionableMessage;
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
    || error instanceof Error && error.name === 'AbortError';
}

export function backgroundRemovalFallbackMessage(error?: unknown): string {
  if (error instanceof AiProcessingError) return error.actionableMessage;
  if (isAbortError(error)) return 'Background removal was cancelled because a newer edit was requested.';
  return 'Background removal is unavailable in this browser right now. You can continue with the original photo or choose a white/solid background.';
}

export function toBackgroundRemovalError(error: unknown): AiProcessingError {
  if (error instanceof AiProcessingError) return error;
  if (isAbortError(error)) {
    return new AiProcessingError(
      'cancelled',
      'Background removal was cancelled.',
      'Background removal was cancelled because a newer edit was requested.',
      error,
    );
  }

  return new AiProcessingError(
    'processing-failed',
    error instanceof Error ? error.message : 'Background removal failed.',
    'We could not remove the background on this device. Try a smaller image, or continue with original, white, or solid background modes.',
    error,
  );
}
