'use client';

import { useMemo, useState } from 'react';

import { PassportGuidelines } from '../components/passport-guidelines';
import { PhotoUpload } from '../components/photo-upload';
import { usePhotoStatus } from '../hooks/use-photo-status';

export default function Page() {
  const [inputSessionId, setInputSessionId] = useState('demo-session');
  const [sessionId, setSessionId] = useState('demo-session');
  const { isLoading, error, hasUploaded, hasCropped, uploadedPhotoUrl, croppedPhotoUrl, complianceStatus, isActive } =
    usePhotoStatus(sessionId);

  const statusItems = useMemo(
    () => [
      { label: 'Session ID', value: sessionId || 'Not set' },
      { label: 'Tracking active', value: isActive ? 'Yes' : 'No' },
      { label: 'Upload status', value: hasUploaded ? 'Uploaded' : 'Waiting for upload' },
      { label: 'Crop status', value: hasCropped ? 'Cropped' : 'Waiting for crop' },
      { label: 'Compliance status', value: complianceStatus },
    ],
    [complianceStatus, hasCropped, hasUploaded, isActive, sessionId],
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Photo Crop App</h1>
        <p className="text-sm text-slate-700">Track the upload and crop pipeline for a photo session.</p>
      </div>

      <PassportGuidelines />
      <PhotoUpload />

      <form
        className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          setSessionId(inputSessionId.trim());
        }}
      >
        <label className="flex flex-col gap-2 text-sm font-medium">
          Session ID
          <input
            aria-label="Session ID"
            className="rounded-md border border-slate-300 px-3 py-2"
            value={inputSessionId}
            onChange={(event) => setInputSessionId(event.target.value)}
            placeholder="Enter session ID"
          />
        </label>
        <button className="w-fit rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white" type="submit">
          Check photo status
        </button>
      </form>

      <section aria-live="polite" className="rounded-lg border border-slate-200 p-4">
        <h2 className="text-lg font-medium">Current photo status</h2>
        {isLoading ? <p className="mt-3 text-sm">Loading status…</p> : null}
        {error ? <p className="mt-3 text-sm text-red-700">Error: {error}</p> : null}

        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {statusItems.map((item) => (
            <div key={item.label} className="rounded-md bg-slate-50 p-3">
              <dt className="text-xs uppercase tracking-wide text-slate-700">{item.label}</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">{item.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 space-y-3 text-sm">
          <div>
            <p className="font-medium">Uploaded photo URL</p>
            {uploadedPhotoUrl ? (
              <a className="text-blue-700 underline" href={uploadedPhotoUrl}>
                {uploadedPhotoUrl}
              </a>
            ) : (
              <p className="text-slate-700">Not available yet</p>
            )}
          </div>
          <div>
            <p className="font-medium">Cropped photo URL</p>
            {croppedPhotoUrl ? (
              <a className="text-blue-700 underline" href={croppedPhotoUrl}>
                {croppedPhotoUrl}
              </a>
            ) : (
              <p className="text-slate-700">Not available yet</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
