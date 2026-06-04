'use client';

import { useMemo } from 'react';

import { usePhotoStatus } from '../hooks/use-photo-status';

const DEFAULT_SESSION_ID = 'demo-session';

function getSessionId(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_SESSION_ID;
  }

  const params = new URLSearchParams(window.location.search);
  return params.get('sessionId')?.trim() || DEFAULT_SESSION_ID;
}

export default function Page() {
  const sessionId = useMemo(() => getSessionId(), []);
  const { loading, error, status, uploadedPhotoUrl, croppedPhotoUrl, complianceStatus, hasUploaded, hasCropped } =
    usePhotoStatus(sessionId);

  return (
    <main>
      <section>
        <h1>Photo Crop Status</h1>
        <p data-testid="session-id">Active session: {sessionId}</p>
        <p data-testid="photo-status">Current status: {loading ? 'loading' : status}</p>
        {error ? <p role="alert">{error}</p> : null}

        <ul>
          <li>Upload complete: {hasUploaded ? 'Yes' : 'No'}</li>
          <li>Crop complete: {hasCropped ? 'Yes' : 'No'}</li>
          <li>Compliance status: {complianceStatus ?? 'pending'}</li>
        </ul>

        {uploadedPhotoUrl ? (
          <div>
            <p>Uploaded photo URL</p>
            <a href={uploadedPhotoUrl}>{uploadedPhotoUrl}</a>
          </div>
        ) : null}

        {croppedPhotoUrl ? (
          <div>
            <p>Cropped photo URL</p>
            <a href={croppedPhotoUrl}>{croppedPhotoUrl}</a>
          </div>
        ) : null}
      </section>
    </main>
  );
}
