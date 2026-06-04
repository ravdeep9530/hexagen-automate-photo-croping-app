'use client';

import { type ChangeEvent, type DragEvent, useCallback, useMemo, useRef, useState } from 'react';

type UploadStatus = 'idle' | 'dragging' | 'uploading' | 'success' | 'error';

type UploadResponse = {
  message?: string;
  uploadedPhotoUrl?: string;
  [key: string]: unknown;
};

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  }

  return `${Math.ceil(bytes / 1024)} KB`;
}

function getValidationError(file: File) {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Please upload a JPG, PNG, or WebP image.';
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File size must be ${formatFileSize(MAX_FILE_SIZE_BYTES)} or less.`;
  }

  return null;
}

export function PhotoUpload() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const browseLabel = useMemo(() => {
    if (status === 'uploading') {
      return 'Uploading photo...';
    }

    return 'Choose a photo';
  }, [status]);

  const uploadFile = useCallback((file: File) => {
    const validationError = getValidationError(file);

    if (validationError) {
      setError(validationError);
      setStatus('error');
      setProgress(0);
      setUploadedPhotoUrl(null);
      setUploadedFileName(null);
      return;
    }

    setError(null);
    setStatus('uploading');
    setProgress(0);
    setUploadedPhotoUrl(null);
    setUploadedFileName(file.name);

    const formData = new FormData();
    formData.append('photo', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/uploadPhoto');
    xhr.responseType = 'json';

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || event.total === 0) {
        return;
      }

      setProgress(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onload = () => {
      const response = (xhr.response ?? {}) as UploadResponse;

      if (xhr.status >= 200 && xhr.status < 300) {
        setStatus('success');
        setProgress(100);
        setUploadedPhotoUrl(typeof response.uploadedPhotoUrl === 'string' ? response.uploadedPhotoUrl : null);
        return;
      }

      setStatus('error');
      setError(response.message || 'Upload failed. Please try again.');
      setUploadedPhotoUrl(null);
    };

    xhr.onerror = () => {
      setStatus('error');
      setError('Upload failed. Please check your connection and try again.');
      setUploadedPhotoUrl(null);
    };

    xhr.send(formData);
  }, []);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (!file) {
        return;
      }

      uploadFile(file);
    },
    [uploadFile],
  );

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      handleFiles(event.target.files);
      event.target.value = '';
    },
    [handleFiles],
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setStatus((currentStatus) => (currentStatus === 'uploading' ? currentStatus : 'idle'));
      handleFiles(event.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setStatus((currentStatus) => (currentStatus === 'uploading' ? currentStatus : 'dragging'));
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setStatus((currentStatus) => (currentStatus === 'uploading' ? currentStatus : 'idle'));
  }, []);

  return (
    <section aria-label="Photo upload" className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-950">Upload your photo</h2>
        <p className="text-sm text-slate-700">Drag and drop an image here or choose a file to upload.</p>
      </div>

      <div
        aria-label="Photo upload dropzone"
        className={`mt-4 rounded-lg border-2 border-dashed p-6 text-center transition ${
          status === 'dragging'
            ? 'border-blue-600 bg-blue-50'
            : status === 'error'
              ? 'border-red-400 bg-red-50'
              : status === 'success'
                ? 'border-green-500 bg-green-50'
                : 'border-slate-300 bg-slate-50'
        }`}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <p className="text-sm font-medium text-slate-900">
          {status === 'dragging' ? 'Drop your photo here' : 'Drag and drop your photo here'}
        </p>
        <p className="mt-2 text-xs text-slate-600">
          Accepted formats: JPG, PNG, WebP. Maximum file size: {formatFileSize(MAX_FILE_SIZE_BYTES)}.
        </p>
        <button
          className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={status === 'uploading'}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          {browseLabel}
        </button>
        <input
          ref={inputRef}
          accept={ACCEPTED_TYPES.join(',')}
          aria-label="Photo file input"
          className="sr-only"
          onChange={handleInputChange}
          type="file"
        />
      </div>

      <div aria-live="polite" className="mt-4 space-y-2 text-sm">
        {status === 'idle' ? <p className="text-slate-700">No file uploaded yet.</p> : null}
        {status === 'dragging' ? <p className="text-blue-700">Drop the image to start uploading.</p> : null}
        {status === 'uploading' ? (
          <div>
            <p className="font-medium text-slate-900">Uploading {uploadedFileName}...</p>
            <p className="text-slate-700">Upload progress: {progress}%</p>
          </div>
        ) : null}
        {status === 'success' ? (
          <div>
            <p className="font-medium text-green-700">Upload complete.</p>
            {uploadedPhotoUrl ? (
              <a className="text-blue-700 underline" href={uploadedPhotoUrl}>
                {uploadedPhotoUrl}
              </a>
            ) : (
              <p className="text-slate-700">Your photo was uploaded successfully.</p>
            )}
          </div>
        ) : null}
        {status === 'error' && error ? <p className="font-medium text-red-700">{error}</p> : null}
      </div>
    </section>
  );
}
