'use client';

import { useCallback, useEffect, useState } from 'react';

type GuidelineRequirement = {
  id: string;
  label: string;
  description: string;
};

type GuidelineVisual = {
  id: string;
  label: string;
  assetUrl: string;
  altText: string;
};

type PhotoGuidelinesResponse = {
  requirements: GuidelineRequirement[];
  visuals: GuidelineVisual[];
};

type FetchState = 'loading' | 'error' | 'success';

const initialGuidelines: PhotoGuidelinesResponse = {
  requirements: [],
  visuals: [],
};

export function PassportGuidelines() {
  const [guidelines, setGuidelines] = useState<PhotoGuidelinesResponse>(initialGuidelines);
  const [status, setStatus] = useState<FetchState>('loading');
  const [error, setError] = useState<string | null>(null);

  const loadGuidelines = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const response = await fetch('/api/photoGuidelines');
      const payload = (await response.json()) as Partial<PhotoGuidelinesResponse> & { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to load passport photo guidelines.');
      }

      setGuidelines({
        requirements: Array.isArray(payload.requirements) ? payload.requirements : [],
        visuals: Array.isArray(payload.visuals) ? payload.visuals : [],
      });
      setStatus('success');
    } catch (caughtError) {
      setGuidelines(initialGuidelines);
      setError(
        caughtError instanceof Error ? caughtError.message : 'Unable to load passport photo guidelines.',
      );
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void loadGuidelines();
  }, [loadGuidelines]);

  const isEmpty =
    status === 'success' && guidelines.requirements.length === 0 && guidelines.visuals.length === 0;

  return (
    <section
      aria-label="Passport photo guidelines"
      className="rounded-lg border border-slate-900 bg-white p-6 text-slate-950 shadow-sm"
    >
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Passport photo guidelines</h2>
        <p className="text-sm font-medium text-slate-800">
          Review the official requirements before you upload or crop a photo.
        </p>
      </div>

      <div aria-live="polite" className="mt-4 text-sm font-medium text-slate-950">
        {status === 'loading' ? <p>Loading passport photo guidelines...</p> : null}
        {status === 'error' ? <p>Unable to load guidelines. {error}</p> : null}
        {isEmpty ? <p>No passport photo guidelines are available right now.</p> : null}
        {status === 'success' && !isEmpty ? <p>Passport photo guidelines loaded.</p> : null}
      </div>

      {status === 'error' ? (
        <div className="mt-4 rounded-md border border-red-700 bg-red-50 p-4 text-slate-950">
          <p className="text-sm font-medium">Check your connection and try again.</p>
          <button
            aria-label="Retry loading passport photo guidelines"
            className="mt-3 rounded-md border border-slate-950 bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            onClick={() => {
              void loadGuidelines();
            }}
            type="button"
          >
            Retry
          </button>
        </div>
      ) : null}

      {isEmpty ? (
        <div
          aria-label="Passport guideline details"
          className="mt-6 rounded-md border border-slate-300 bg-slate-50 p-4 text-sm text-slate-950"
        >
          <p>Guideline details will appear here when the service returns requirement and visual data.</p>
        </div>
      ) : null}

      {status === 'success' && !isEmpty ? (
        <div aria-label="Passport guideline details" className="mt-6 space-y-8">
          <section>
            <h3 className="text-lg font-semibold">Requirements</h3>
            <ul className="mt-3 space-y-3">
              {guidelines.requirements.map((requirement) => (
                <li key={requirement.id} className="rounded-md border border-slate-300 bg-slate-50 p-4">
                  <h4 className="text-base font-semibold text-slate-950">{requirement.label}</h4>
                  <p className="mt-1 text-sm text-slate-900">{requirement.description}</p>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold">Visual guidance</h3>
            <ul className="mt-3 grid gap-4 sm:grid-cols-2">
              {guidelines.visuals.map((visual) => (
                <li key={visual.id} className="rounded-md border border-slate-300 bg-slate-50 p-4">
                  <figure className="space-y-3">
                    <img
                      alt={visual.altText}
                      className="h-auto w-full rounded border border-slate-300 bg-white"
                      src={visual.assetUrl}
                    />
                    <figcaption>
                      <p className="text-base font-semibold text-slate-950">{visual.label}</p>
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </section>
  );
}
