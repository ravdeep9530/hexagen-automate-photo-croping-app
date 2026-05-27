import { vi } from 'vitest';

export type AiMockOptions = {
  shouldFail?: boolean;
  fallbackMode?: boolean;
  errorType?: 'load' | 'runtime' | 'abort';
  detectionResult?: {
    faceDetected: boolean;
    confidence: number;
    landmarks?: Array<{ x: number; y: number }>;
    boundingBox?: { x: number; y: number; width: number; height: number };
  };
  backgroundRemovalResult?: {
    mask: ImageData;
    confidence: number;
  };
};

const createMockImageData = (width = 100, height = 100): ImageData => {
  return new ImageData(width, height);
};

export const installAiMocks = (options: AiMockOptions = {}) => {
  const {
    shouldFail = false,
    fallbackMode = false,
    errorType = 'runtime',
    detectionResult = {
      faceDetected: true,
      confidence: 0.95,
      landmarks: [
        { x: 45, y: 40 }, // left eye
        { x: 55, y: 40 }, // right eye
        { x: 50, y: 50 }, // nose
        { x: 50, y: 60 }, // mouth
      ],
      boundingBox: { x: 25, y: 20, width: 50, height: 60 },
    },
    backgroundRemovalResult = {
      mask: createMockImageData(),
      confidence: 0.92,
    },
  } = options;

  const createFaceDetectionModule = () => {
    if (shouldFail && errorType === 'load') {
      return Promise.reject(new Error('Failed to load face detection model'));
    }

    if (fallbackMode) {
      return Promise.resolve({
        detectFaces: vi.fn(() => Promise.resolve({ faceDetected: false, confidence: 0 })),
        dispose: vi.fn(),
        isReady: false,
      });
    }

    return Promise.resolve({
      detectFaces: vi.fn(async (_, __) => {
        if (shouldFail && errorType === 'runtime') {
          throw new Error('Face detection runtime error');
        }
        if (shouldFail && errorType === 'abort') {
          const err = new Error('Detection aborted');
          err.name = 'AbortError';
          throw err;
        }
        return detectionResult;
      }),
      dispose: vi.fn(),
      isReady: true,
    });
  };

  const createBackgroundRemovalModule = () => {
    if (shouldFail && errorType === 'load') {
      return Promise.reject(new Error('Failed to load background removal model'));
    }

    if (fallbackMode) {
      return Promise.resolve({
        removeBackground: vi.fn(() => Promise.resolve(null)),
        dispose: vi.fn(),
        isReady: false,
      });
    }

    return Promise.resolve({
      removeBackground: vi.fn(async (_, __) => {
        if (shouldFail && errorType === 'runtime') {
          throw new Error('Background removal runtime error');
        }
        if (shouldFail && errorType === 'abort') {
          const err = new Error('Removal aborted');
          err.name = 'AbortError';
          throw err;
        }
        return backgroundRemovalResult;
      }),
      dispose: vi.fn(),
      isReady: true,
    });
  };

  // Mock the dynamic imports used in the AI modules
  const faceDetectionMock = vi.fn(() => createFaceDetectionModule());
  const backgroundRemovalMock = vi.fn(() => createBackgroundRemovalModule());

  // Return cleanup function and mocks
  return {
    faceDetectionMock,
    backgroundRemovalMock,
    dispose: vi.fn(),
  };
};

export const createLazyMock = (moduleName: string, implementation: unknown) => {
  return vi.fn(() => Promise.resolve(implementation));
};

export const mockAiLazyImports = (options: AiMockOptions = {}) => {
  const aiMocks = installAiMocks(options);

  // Mock any global lazy import cache or registry if it exists
  const originalDefine = (globalThis as Record<string, unknown>)['__AI_MODULE_CACHE__'];
  (globalThis as Record<string, unknown>)['__AI_MODULE_CACHE__'] = {
    faceDetection: null,
    backgroundRemoval: null,
  };

  return {
    ...aiMocks,
    restore: () => {
      (globalThis as Record<string, unknown>)['__AI_MODULE_CACHE__'] = originalDefine;
      vi.restoreAllMocks();
    },
  };
};
