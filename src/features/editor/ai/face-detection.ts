/**
 * Face Detection Module
 *
 * Client-only, lazy face detection abstraction. The default provider uses the
 * browser FaceDetector API when available, while tests can inject a provider so
 * no model/browser dependency is required.
 */

export type FaceDetectionStatus = 'detected' | 'not-detected' | 'failed' | 'landmark-unavailable';
export type FaceDetectionFailureReason = 'unsupported-browser' | 'model-load-failed' | 'processing-failed' | 'invalid-input' | 'cancelled';
export type FaceGuidanceSeverity = 'success' | 'warning' | 'error' | 'info';

export interface FaceBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EyeLandmarks {
  left: { x: number; y: number };
  right: { x: number; y: number };
}

export interface FaceGuidanceMessage {
  code: string;
  severity: FaceGuidanceSeverity;
  message: string;
}

export interface DetectedFace {
  boundingBox: FaceBoundingBox;
  landmarks?: Record<string, { x: number; y: number }>;
  eyes?: EyeLandmarks;
  confidence?: number;
}

export interface FaceDetectionResult {
  status: FaceDetectionStatus;
  faceCount: number;
  faces: DetectedFace[];
  boundingBox?: FaceBoundingBox;
  eyes?: EyeLandmarks;
  confidence?: number;
  guidance: FaceGuidanceMessage[];
  reason?: FaceDetectionFailureReason;
  error?: string;
}

export type FaceDetectionSource = HTMLImageElement | HTMLCanvasElement | ImageBitmap | Blob | File | string;

export interface FaceDetectionProvider {
  detect(source: FaceDetectionSource, options?: { signal?: AbortSignal }): Promise<DetectedFace[]>;
}

type ProviderLoader = () => Promise<FaceDetectionProvider>;

let providerCache: FaceDetectionProvider | null = null;
let providerLoadPromise: Promise<FaceDetectionProvider> | null = null;
let providerLoader: ProviderLoader = createBrowserFaceDetectorProvider;

export function setFaceDetectionProviderForTests(providerOrLoader: FaceDetectionProvider | ProviderLoader): void {
  providerLoader = typeof providerOrLoader === 'function'
    ? providerOrLoader as ProviderLoader
    : async () => providerOrLoader;
  clearFaceDetectionCache();
}

export function clearFaceDetectionCache(): void {
  providerCache = null;
  providerLoadPromise = null;
}

export function isFaceDetectionProviderLoaded(): boolean {
  return providerCache !== null;
}

export async function loadFaceDetectionProvider(signal?: AbortSignal): Promise<FaceDetectionProvider> {
  if (providerCache) return providerCache;
  if (providerLoadPromise) return providerLoadPromise;
  if (signal?.aborted) throw new FaceDetectionError('cancelled', 'Face detection was cancelled.');

  providerLoadPromise = (async () => {
    try {
      const provider = await providerLoader();
      if (signal?.aborted) throw new FaceDetectionError('cancelled', 'Face detection was cancelled.');
      providerCache = provider;
      return provider;
    } catch (error) {
      providerLoadPromise = null;
      if (error instanceof FaceDetectionError) throw error;
      throw new FaceDetectionError('model-load-failed', error instanceof Error ? error.message : 'Unable to load face detection.');
    }
  })();

  return providerLoadPromise;
}

export async function detectFace(
  source: FaceDetectionSource | null | undefined,
  options: { signal?: AbortSignal } = {},
): Promise<FaceDetectionResult> {
  const { signal } = options;
  if (!source) return failedResult('invalid-input', 'No image was provided for face detection.');
  if (signal?.aborted) return failedResult('cancelled', 'Face detection was cancelled.');

  try {
    const provider = await loadFaceDetectionProvider(signal);
    if (signal?.aborted) return failedResult('cancelled', 'Face detection was cancelled.');

    const faces = await provider.detect(source, { signal });
    if (signal?.aborted) return failedResult('cancelled', 'Face detection was cancelled.');

    return createFaceDetectionResult(faces);
  } catch (error) {
    if (error instanceof FaceDetectionError) return failedResult(error.reason, error.message);
    if (error instanceof Error && error.name === 'AbortError') return failedResult('cancelled', 'Face detection was cancelled.');
    return failedResult('processing-failed', error instanceof Error ? error.message : 'Face detection failed.');
  }
}

export function createFaceDetectionResult(faces: DetectedFace[]): FaceDetectionResult {
  if (faces.length === 0) {
    return {
      status: 'not-detected',
      faceCount: 0,
      faces: [],
      guidance: [{ code: 'face-missing', severity: 'error', message: 'No face detected. Use a clear, front-facing photo.' }],
    };
  }

  if (faces.length > 1) {
    return {
      status: 'not-detected',
      faceCount: faces.length,
      faces,
      boundingBox: faces[0]?.boundingBox,
      eyes: faces[0]?.eyes,
      confidence: faces[0]?.confidence,
      guidance: [{ code: 'multiple-faces', severity: 'error', message: 'Multiple faces detected. Use a photo with only the applicant visible.' }],
    };
  }

  const primary = faces[0];
  const hasEyes = Boolean(primary.eyes);
  return {
    status: hasEyes ? 'detected' : 'landmark-unavailable',
    faceCount: 1,
    faces,
    boundingBox: primary.boundingBox,
    eyes: primary.eyes,
    confidence: primary.confidence,
    guidance: [
      {
        code: hasEyes ? 'face-detected' : 'eye-landmarks-unavailable',
        severity: hasEyes ? 'success' : 'warning',
        message: hasEyes
          ? 'Face detected. Use the guides to center the head and align the eyes.'
          : 'Face detected, but eye landmarks are unavailable. Use the head guide and visually align the eyes.',
      },
    ],
  };
}

export function generateFaceGuidance(
  result: FaceDetectionResult,
  frame?: { width: number; height: number },
  rule: HeadPositionRule = DEFAULT_HEAD_POSITION_RULE,
): FaceGuidanceMessage[] {
  const messages = [...result.guidance];
  if ((result.status !== 'detected' && result.status !== 'landmark-unavailable') || !result.boundingBox || !frame) return messages;

  const box = result.boundingBox;
  const centerX = (box.x + box.width / 2) / frame.width;
  const centerY = (box.y + box.height / 2) / frame.height;
  const widthRatio = box.width / frame.width;
  const heightRatio = box.height / frame.height;

  if (centerX < rule.centerXMin) messages.push({ code: 'move-right', severity: 'warning', message: 'Move or crop the face slightly to the right.' });
  if (centerX > rule.centerXMax) messages.push({ code: 'move-left', severity: 'warning', message: 'Move or crop the face slightly to the left.' });
  if (centerY < rule.centerYMin) messages.push({ code: 'move-down', severity: 'warning', message: 'Lower the face in the crop.' });
  if (centerY > rule.centerYMax) messages.push({ code: 'move-up', severity: 'warning', message: 'Raise the face in the crop.' });
  if (widthRatio < rule.faceWidthMinRatio || heightRatio < rule.headHeightMinRatio) messages.push({ code: 'face-too-small', severity: 'warning', message: 'Zoom in so the head fills more of the photo.' });
  if (widthRatio > rule.faceWidthMaxRatio || heightRatio > rule.headHeightMaxRatio) messages.push({ code: 'face-too-large', severity: 'warning', message: 'Zoom out so the full head remains comfortably inside the photo.' });

  if (result.eyes) {
    const eyeTilt = Math.abs(result.eyes.left.y - result.eyes.right.y) / Math.max(1, frame.height);
    if (eyeTilt > rule.maxEyeTiltRatio) messages.push({ code: 'eyes-not-level', severity: 'warning', message: 'Level the eyes by rotating the photo slightly.' });
  } else if (rule.requireEyeLandmarks) {
    messages.push({ code: 'eyes-required', severity: 'warning', message: 'Eye landmarks are needed for this preset; verify eye position manually.' });
  }

  if (messages.length === result.guidance.length) {
    messages.push({ code: 'face-position-ok', severity: 'success', message: 'Face position appears to match the selected guide.' });
  }

  return messages;
}

export interface HeadPositionRule {
  centerXMin: number;
  centerXMax: number;
  centerYMin: number;
  centerYMax: number;
  faceWidthMinRatio: number;
  faceWidthMaxRatio: number;
  headHeightMinRatio: number;
  headHeightMaxRatio: number;
  maxEyeTiltRatio: number;
  requireEyeLandmarks: boolean;
}

export const DEFAULT_HEAD_POSITION_RULE: HeadPositionRule = {
  centerXMin: 0.35,
  centerXMax: 0.65,
  centerYMin: 0.25,
  centerYMax: 0.65,
  faceWidthMinRatio: 0.25,
  faceWidthMaxRatio: 0.65,
  headHeightMinRatio: 0.35,
  headHeightMaxRatio: 0.8,
  maxEyeTiltRatio: 0.025,
  requireEyeLandmarks: false,
};

export function normalizeHeadPositionRule(parameters: Record<string, unknown> = {}): HeadPositionRule {
  const preset = typeof parameters.headPositionRule === 'string' ? parameters.headPositionRule : 'standard';
  const base: HeadPositionRule = preset === 'strict-passport'
    ? { ...DEFAULT_HEAD_POSITION_RULE, centerXMin: 0.42, centerXMax: 0.58, centerYMin: 0.28, centerYMax: 0.58, requireEyeLandmarks: true }
    : { ...DEFAULT_HEAD_POSITION_RULE };

  for (const key of Object.keys(base) as Array<keyof HeadPositionRule>) {
    const value = parameters[key];
    if (typeof base[key] === 'boolean') (base[key] as boolean) = typeof value === 'boolean' ? value : base[key] as boolean;
    else if (typeof value === 'number') (base[key] as number) = value;
  }
  return base;
}

class FaceDetectionError extends Error {
  constructor(public reason: FaceDetectionFailureReason, message: string) {
    super(message);
    this.name = 'FaceDetectionError';
  }
}

function failedResult(reason: FaceDetectionFailureReason, message: string): FaceDetectionResult {
  const code = reason === 'unsupported-browser' ? 'face-detection-unsupported' : reason;
  return { status: 'failed', faceCount: 0, faces: [], reason, error: message, guidance: [{ code, severity: 'warning', message }] };
}

type BrowserFaceDetector = new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => {
  detect(source: CanvasImageSource): Promise<Array<{ boundingBox: DOMRectReadOnly; landmarks?: Array<{ type: string; locations: Array<{ x: number; y: number }> }>; }>>;
};

async function createBrowserFaceDetectorProvider(): Promise<FaceDetectionProvider> {
  if (typeof window === 'undefined') throw new FaceDetectionError('unsupported-browser', 'Face detection runs only in the browser.');
  const Detector = (window as unknown as { FaceDetector?: BrowserFaceDetector }).FaceDetector;
  if (!Detector) throw new FaceDetectionError('unsupported-browser', 'This browser does not support local face detection. You can still position the photo manually.');
  const detector = new Detector({ fastMode: true, maxDetectedFaces: 2 });
  return {
    async detect(source) {
      const imageSource = await toCanvasImageSource(source);
      const detected = await detector.detect(imageSource);
      return detected.map(face => {
        const landmarks = landmarksToRecord(face.landmarks);
        const eyes = extractEyes(landmarks);
        return {
          boundingBox: {
            x: face.boundingBox.x,
            y: face.boundingBox.y,
            width: face.boundingBox.width,
            height: face.boundingBox.height,
          },
          landmarks,
          eyes,
        };
      });
    },
  };
}

async function toCanvasImageSource(source: FaceDetectionSource): Promise<CanvasImageSource> {
  if (typeof source !== 'string' && !(source instanceof Blob)) return source as CanvasImageSource;
  const url = typeof source === 'string' ? source : URL.createObjectURL(source);
  try {
    const image = new Image();
    image.decoding = 'async';
    image.src = url;
    await image.decode();
    return image;
  } finally {
    if (typeof source !== 'string') URL.revokeObjectURL(url);
  }
}

function landmarksToRecord(landmarks?: Array<{ type: string; locations: Array<{ x: number; y: number }> }>): Record<string, { x: number; y: number }> | undefined {
  if (!landmarks?.length) return undefined;
  const record: Record<string, { x: number; y: number }> = {};
  for (const landmark of landmarks) {
    const first = landmark.locations[0];
    if (first) record[landmark.type] = { x: first.x, y: first.y };
  }
  return Object.keys(record).length ? record : undefined;
}

function extractEyes(landmarks?: Record<string, { x: number; y: number }>): EyeLandmarks | undefined {
  if (!landmarks) return undefined;
  const left = landmarks.leftEye ?? landmarks.left_eye ?? landmarks.eyeLeft;
  const right = landmarks.rightEye ?? landmarks.right_eye ?? landmarks.eyeRight;
  return left && right ? { left, right } : undefined;
}
