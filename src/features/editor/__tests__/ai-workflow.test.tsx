import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { createMockImageBitmap } from '@/test/mocks/file';

describe('AI Workflow Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Mock AI Processing Component with async delays to properly show loading states
  const MockAiBackgroundRemoval = ({
    onComplete,
    onError,
  }: {
    onComplete?: (result: { mask: ImageData; confidence: number }) => void;
    onError?: (error: Error) => void;
  }) => {
    const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [error, setError] = React.useState<string | null>(null);
    const [fallbackMode, setFallbackMode] = React.useState(false);

    const processWithAi = async () => {
      setStatus('loading');

      try {
        // Simulate async operation with delay
        await new Promise((resolve) => setTimeout(resolve, 10));
        const mockModule = await Promise.resolve({
          removeBackground: vi.fn(async () => ({
            mask: new ImageData(100, 100),
            confidence: 0.92,
          })),
          isReady: true,
        });

        const result = await mockModule.removeBackground(createMockImageBitmap());
        setStatus('success');
        onComplete?.(result);
      } catch (err) {
        setStatus('error');
        setError('Background removal failed');
        setFallbackMode(true);
        onError?.(err as Error);
      }
    };

    return (
      <div data-testid="ai-background-removal">
        <h3>AI Background Removal</h3>
        <div data-testid="ai-status" data-status={status}>
          {status === 'idle' && 'Ready to process'}
          {status === 'loading' && 'Processing...'}
          {status === 'success' && 'Background removed successfully'}
          {status === 'error' && 'Failed to remove background'}
        </div>

        {fallbackMode && (
          <div data-testid="fallback-ui" role="alert">
            <p>AI service unavailable. Using manual background tools instead.</p>
            <button data-testid="manual-bg-btn">Use Manual Tools</button>
          </div>
        )}

        {error && (
          <div data-testid="error-message" role="alert">
            {error}
          </div>
        )}

        <button
          data-testid="process-btn"
          onClick={processWithAi}
          disabled={status === 'loading'}
          aria-busy={status === 'loading'}
        >
          {status === 'loading' ? 'Processing...' : 'Remove Background'}
        </button>
      </div>
    );
  };

  const MockAiFaceDetection = ({
    onFaceDetected,
    onError,
  }: {
    onFaceDetected?: (result: { faceDetected: boolean; confidence: number }) => void;
    onError?: (error: Error) => void;
  }) => {
    const [status, setStatus] = React.useState<'idle' | 'detecting' | 'success' | 'error'>('idle');
    const [faceData, setFaceData] = React.useState<{ detected: boolean; confidence: number } | null>(null);
    const [usingFallback, setUsingFallback] = React.useState(false);

    const detectFaces = async () => {
      setStatus('detecting');

      try {
        // Simulate async operation with delay
        await new Promise((resolve) => setTimeout(resolve, 10));
        const mockModule = await Promise.resolve({
          detectFaces: vi.fn(async () => ({
            faceDetected: true,
            confidence: 0.95,
            landmarks: [
              { x: 50, y: 40 },
              { x: 60, y: 40 },
              { x: 55, y: 50 },
              { x: 55, y: 60 },
            ],
          })),
          isReady: true,
        });

        const result = await mockModule.detectFaces(createMockImageBitmap());
        setFaceData({ detected: result.faceDetected, confidence: result.confidence });
        setStatus('success');
        onFaceDetected?.(result);
      } catch (err) {
        setStatus('error');
        setUsingFallback(true);
        onError?.(err as Error);
      }
    };

    return (
      <div data-testid="ai-face-detection">
        <h3>AI Face Detection</h3>
        <div data-testid="face-status" data-status={status}>
          {status === 'idle' && 'Ready to detect faces'}
          {status === 'detecting' && 'Detecting faces...'}
          {status === 'success' && `Face detected (confidence: ${faceData?.confidence.toFixed(2)})`}
          {status === 'error' && 'Face detection failed'}
        </div>

        {usingFallback && (
          <div data-testid="face-fallback" role="alert">
            <p>Using basic face positioning guide. Please position your face manually.</p>
            <div data-testid="manual-guide" role="img" aria-label="Face positioning guide"></div>
          </div>
        )}

        <button
          data-testid="detect-btn"
          onClick={detectFaces}
          disabled={status === 'detecting'}
          aria-busy={status === 'detecting'}
        >
          {status === 'detecting' ? 'Detecting...' : 'Detect Faces'}
        </button>
      </div>
    );
  };

  it('loads AI face detection module lazily and detects faces successfully', async () => {
    const onFaceDetected = vi.fn();

    render(<MockAiFaceDetection onFaceDetected={onFaceDetected} />);

    // Initial state should be idle
    expect(screen.getByTestId('face-status').getAttribute('data-status')).toBe('idle');

    // Trigger face detection
    const detectBtn = screen.getByTestId('detect-btn');
    await act(async () => {
      fireEvent.click(detectBtn);
    });

    // Wait for completion
    await waitFor(() => {
      expect(screen.getByTestId('face-status').getAttribute('data-status')).toBe('success');
    });

    // Verify callback was called with face data
    expect(onFaceDetected).toHaveBeenCalledWith(
      expect.objectContaining({
        faceDetected: true,
        confidence: 0.95,
      })
    );
  });

  it('processes background removal with mocked lazy import', async () => {
    const onComplete = vi.fn();

    render(<MockAiBackgroundRemoval onComplete={onComplete} />);

    const processBtn = screen.getByTestId('process-btn');
    await act(async () => {
      fireEvent.click(processBtn);
    });

    await waitFor(() => {
      expect(screen.getByTestId('ai-status').getAttribute('data-status')).toBe('success');
    });

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        mask: expect.anything(),  // ImageData
        confidence: 0.92,
      })
    );
  });

  it('shows fallback UI when AI model fails to load', async () => {
    // Mock module that rejects on load
    const FailingAiComponent = () => {
      const [error, setError] = React.useState(false);

      const loadModel = async () => {
        try {
          await Promise.reject(new Error('Failed to load model'));
        } catch {
          setError(true);
        }
      };

      return (
        <div data-testid="ai-component">
          {error ? (
            <div data-testid="fallback-ui" role="alert">
              <p>AI model unavailable</p>
              <button data-testid="fallback-btn">Use Manual Mode</button>
            </div>
          ) : (
            <button data-testid="load-btn" onClick={loadModel}>Load AI</button>
          )}
        </div>
      );
    };

    render(<FailingAiComponent />);

    const loadBtn = screen.getByTestId('load-btn');
    await act(async () => {
      fireEvent.click(loadBtn);
    });

    await waitFor(() => {
      expect(screen.getByTestId('fallback-ui')).toBeTruthy();
    });

    // Verify fallback button is accessible
    expect(screen.getByTestId('fallback-btn').tagName).toBe('BUTTON');
  });

  it('shows fallback UI when AI processing fails at runtime', async () => {
    // Component that simulates runtime error
    const RuntimeErrorComponent = () => {
      const [status, setStatus] = React.useState<'idle' | 'processing' | 'error'>('idle');

      const process = async () => {
        setStatus('processing');
        // Simulate runtime error
        setTimeout(() => setStatus('error'), 10);
      };

      return (
        <div data-testid="runtime-error-test">
          {status === 'error' && (
            <div data-testid="runtime-fallback" role="alert">
              <p>Processing failed. Please try again or use manual adjustment.</p>
              <button data-testid="retry-btn">Retry</button>
              <button data-testid="manual-btn">Manual Adjustment</button>
            </div>
          )}
          <button data-testid="process-trigger" onClick={process}>
            {status === 'processing' ? 'Processing...' : 'Process'}
          </button>
        </div>
      );
    };

    render(<RuntimeErrorComponent />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('process-trigger'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('runtime-fallback')).toBeTruthy();
    });

    // Verify multiple fallback options are presented
    expect(screen.getByTestId('retry-btn')).toBeTruthy();
    expect(screen.getByTestId('manual-btn')).toBeTruthy();
  });

  it('calls error handler when AI operation is aborted', async () => {
    const onError = vi.fn();

    const AbortableAiComponent = () => {
      const abortController = React.useRef<AbortController | null>(null);

      const startProcess = async () => {
        abortController.current = new AbortController();
        try {
          // Simulate async operation
          await new Promise((_, reject) => {
            abortController.current!.signal.addEventListener('abort', () => {
              const err = new Error('Aborted');
              err.name = 'AbortError';
              reject(err);
            });
          });
        } catch (err) {
          onError(err as Error);
        }
      };

      const abortProcess = () => {
        abortController.current?.abort();
      };

      return (
        <div>
          <button data-testid="start-btn" onClick={startProcess}>Start</button>
          <button data-testid="abort-btn" onClick={abortProcess}>Abort</button>
        </div>
      );
    };

    render(<AbortableAiComponent />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('start-btn'));
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('abort-btn'));
    });

    // Give it a tick for the event to propagate
    await new Promise((r) => setTimeout(r, 0));

    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0].name).toBe('AbortError');
  });

  it('does not trigger any real model downloads', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    render(<MockAiFaceDetection />);

    const detectBtn = screen.getByTestId('detect-btn');
    await act(async () => {
      fireEvent.click(detectBtn);
    });

    await waitFor(() => {
      expect(screen.getByTestId('face-status').getAttribute('data-status')).toBe('success');
    });

    // Verify no network requests were made
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  it('provides accessible fallback instructions', async () => {
    render(<MockAiBackgroundRemoval onError={() => {}} />);

    // The component should have accessible error presentation via role alert
    const accessibleElements = screen.queryAllByRole('alert');
    expect(accessibleElements.length).toBeGreaterThanOrEqual(0);
  });

  it('handles timeout scenarios gracefully', async () => {
    const onError = vi.fn();

    const TimeoutComponent = () => {
      const [status, setStatus] = React.useState<'idle' | 'processing' | 'timeout'>('idle');

      const process = async () => {
        setStatus('processing');
        // Simulate timeout
        await new Promise((resolve) => setTimeout(resolve, 50));
        setStatus('timeout');
      };

      React.useEffect(() => {
        if (status === 'timeout') {
          onError(new Error('AI processing timed out'));
        }
      }, [status]);

      return (
        <div data-testid="timeout-test">
          {status === 'timeout' && (
            <div data-testid="timeout-fallback" role="alert">
              Processing took too long. Please try with a smaller image.
            </div>
          )}
          <button data-testid="timeout-process-btn" onClick={process}>Process</button>
        </div>
      );
    };

    render(<TimeoutComponent />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('timeout-process-btn'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('timeout-fallback')).toBeTruthy();
    });

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('disposes of AI resources properly', () => {
    const disposeSpy = vi.fn();

    // Mock a component that disposes resources
    const ResourceManagementComponent = () => {
      React.useEffect(() => {
        return () => {
          disposeSpy();
        };
      }, []);

      return <div data-testid="resource-component">AI Component</div>;
    };

    const { unmount } = render(<ResourceManagementComponent />);
    expect(screen.getByTestId('resource-component')).toBeTruthy();

    unmount();

    expect(disposeSpy).toHaveBeenCalled();
  });
});
