'use client';

import { useRef, useState } from 'react';

import type { UploadPhotoResponse } from '../types/api';

type UploadState = 'idle' | 'dragging' | 'uploading' | 'error' | 'success';

const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const PROGRESS_STEPS = [15, 45, 75, 95];

function formatAcceptedTypes(types: string[]) {
  return types.map((type) => type.replace('image/', '').toUpperCase()).join(', ');
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Unable to upload your photo right now. Please try again.';
}

export default function PhotoUpload() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [state, setState] = useState<UploadState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [response, setResponse] = useState<UploadPhotoResponse | null>(null);

  const clearProgressTimer = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const resetFeedback = () => {
    setErrorMessage('');
    setResponse(null);
    setUploadedFileName('');
  };

  const validateFile = (file: File) => {
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      return `Please upload a supported image type: ${formatAcceptedTypes(ACCEPTED_MIME_TYPES)}.`;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return 'Please upload an image smaller than 10 MB.';
    }

    return '';
  };

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file);

    if (validationError) {
      clearProgressTimer();
      setState('error');
      setProgress(0);
      setResponse(null);
      setUploadedFileName('');
      setErrorMessage(validationError);
      return;
    }

    resetFeedback();
    setState('uploading');
    setProgress(PROGRESS_STEPS[0]);
    setUploadedFileName(file.name);

    let currentStepIndex = 1;
    clearProgressTimer();
    progressIntervalRef.current = setInterval(() => {
      setProgress((currentProgress) => {
        if (currentStepIndex >= PROGRESS_STEPS.length) {
          return currentProgress;
        }

        const nextProgress = PROGRESS_STEPS[currentStepIndex];
        currentStepIndex += 1;
        return nextProgress;
      });
    }, 250);

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const uploadResponse = await fetch('/api/uploadPhoto', {
        method: 'POST',
        body: formData,
      });
      const payload = (await uploadResponse.json()) as Partial<UploadPhotoResponse> & {
        error?: string;
        message?: string;
      };

      if (!uploadResponse.ok) {
        throw new Error(payload.error || payload.message || 'Unable to upload your photo right now. Please try again.');
      }

      clearProgressTimer();
      setProgress(100);
      setResponse({
        sessionId: typeof payload.sessionId === 'string' ? payload.sessionId : '',
        imageId: typeof payload.imageId === 'string' ? payload.imageId : '',
        url: typeof payload.url === 'string' ? payload.url : '',
      });
      setState('success');
    } catch (error) {
      clearProgressTimer();
      setProgress(0);
      setResponse(null);
      setState('error');
      setErrorMessage(getErrorMessage(error));
    }
  };

  return (
    <section
      aria-labelledby="photo-upload-title"
      className="rounded-lg border border-slate-300 bg-white p-6 text-slate-950 shadow-sm"
    >
      <div className="mb-4">
        <h2 id="photo-upload-title" className="text-2xl font-semibold text-slate-950">
          Upload your photo
        </h2>
        <p className="mt-2 text-sm text-slate-700">
          Drag and drop an image here or choose a file to upload. Accepted formats: {formatAcceptedTypes(ACCEPTED_MIME_TYPES)}.
        </p>
      </div>

      <div aria-live="polite" aria-atomic="true" className="mb-4 min-h-6 text-sm font-medium text-slate-900">
        {state === 'idle' && <p role="status">Ready to upload your photo.</p>}
        {state === 'dragging' && <p role="status">Drop your image to start uploading.</p>}
        {state === 'uploading' && <p role="status">Uploading {uploadedFileName}… {progress}%</p>}
        {state === 'error' && <p role="alert">{errorMessage}</p>}
        {state === 'success' && response && <p role="status">Upload complete for {uploadedFileName}.</p>}
      </div>

      <div
        aria-label="Photo upload dropzone"
        onDragOver={(event) => {
          event.preventDefault();
          if (state !== 'uploading') {
            setState('dragging');
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          if (state !== 'uploading') {
            setState('dragging');
          }
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (state !== 'uploading') {
            setState('idle');
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          const file = event.dataTransfer.files?.[0];
          if (!file) {
            setState('idle');
            return;
          }

          void uploadFile(file);
        }}
        className={`rounded-lg border-2 border-dashed p-6 transition ${
          state === 'dragging'
            ? 'border-sky-500 bg-sky-50'
            : state === 'error'
              ? 'border-red-400 bg-red-50'
              : state === 'success'
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-slate-400 bg-slate-50'
        }`}
      >
        <div className="flex flex-col items-start gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-950">Drop your image here</p>
            <p className="mt-1 text-sm text-slate-700">Maximum file size: 10 MB.</p>
          </div>

          <label className="inline-flex cursor-pointer items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 focus-within:ring-2 focus-within:ring-slate-900 focus-within:ring-offset-2">
            <span>Choose file</span>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_MIME_TYPES.join(',')}
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void uploadFile(file);
                }
              }}
            />
          </label>
        </div>
      </div>

      {state === 'uploading' && (
        <div className="mt-4" aria-label="Upload progress">
          <div className="mb-2 flex items-center justify-between text-sm text-slate-800">
            <span>Upload progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-sky-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {state === 'success' && response && (
        <div
          aria-label="Upload success"
          className="mt-4 rounded-md border border-emerald-300 bg-emerald-50 p-4 text-emerald-900"
        >
          <p className="text-sm font-semibold">Photo uploaded successfully.</p>
          <dl className="mt-2 space-y-1 text-sm">
            <div>
              <dt className="inline font-semibold">Session ID: </dt>
              <dd className="inline">{response.sessionId || 'Unavailable'}</dd>
            </div>
            <div>
              <dt className="inline font-semibold">Image ID: </dt>
              <dd className="inline">{response.imageId || 'Unavailable'}</dd>
            </div>
            <div>
              <dt className="inline font-semibold">URL: </dt>
              <dd className="inline break-all">{response.url || 'Unavailable'}</dd>
            </div>
          </dl>
        </div>
      )}
    </section>
  );
}
