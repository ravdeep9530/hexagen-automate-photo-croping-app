export class PreviewRenderAbortController {
  private activeController?: AbortController;
  private sequence = 0;

  nextSignal(): { id: number; signal: AbortSignal } {
    this.abortActive();
    this.activeController = new AbortController();
    this.sequence += 1;
    return { id: this.sequence, signal: this.activeController.signal };
  }

  abortActive(): void {
    if (this.activeController && !this.activeController.signal.aborted) {
      this.activeController.abort();
    }
  }

  isStale(id: number): boolean {
    return id !== this.sequence || Boolean(this.activeController?.signal.aborted);
  }
}

export function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new DOMException('Preview render aborted.', 'AbortError');
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}
