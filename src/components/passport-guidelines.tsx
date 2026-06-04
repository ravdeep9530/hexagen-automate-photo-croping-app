'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type {
  PhotoGuidelineRequirement,
  PhotoGuidelineVisual,
  PhotoGuidelinesResponse,
} from '../types/api';

type FetchState = 'loading' | 'success' | 'empty' | 'error';

function isRequirement(value: unknown): value is PhotoGuidelineRequirement {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const requirement = value as Partial<PhotoGuidelineRequirement>;
  return (
    typeof requirement.id === 'string' &&
    typeof requirement.label === 'string' &&
    typeof requirement.value === 'string'
  );
}

function isVisual(value: unknown): value is Partial<PhotoGuidelineVisual> & { id: string; title: string } {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const visual = value as Partial<PhotoGuidelineVisual>;
  return typeof visual.id === 'string' && typeof visual.title === 'string';
}

function normalizeResponse(payload: unknown): PhotoGuidelinesResponse {
  if (!payload || typeof payload !== 'object') {
    return { requirements: [], visuals: [] };
  }

  const data = payload as Partial<PhotoGuidelinesResponse>;

  return {
    requirements: Array.isArray(data.requirements) ? data.requirements.filter(isRequirement) : [],
    visuals: Array.isArray(data.visuals) ? data.visuals.filter(isVisual).map((visual) => ({
      id: visual.id,
      title: visual.title,
      imageUrl: typeof visual.imageUrl === 'string' ? visual.imageUrl : '',
      altText: typeof visual.altText === 'string' ? visual.altText : '',
    })) : [],
  };
}

export default function PassportGuidelines() {
  const [guidelines, setGuidelines] = useState<PhotoGuidelinesResponse>({
    requirements: [],
    visuals: [],
  });
  const [state, setState] = useState<FetchState>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const hasContent = useMemo(
    () => guidelines.requirements.length > 0 || guidelines.visuals.length > 0,
    [guidelines],
  );

  const loadGuidelines = useCallback(async () => {
    setState('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/photoGuidelines');
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          (payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
            ? payload.error
            : undefined) || 'Unable to load passport photo guidelines.',
        );
      }

      const nextGuidelines = normalizeResponse(payload);
      setGuidelines(nextGuidelines);
      setState(
        nextGuidelines.requirements.length === 0 && nextGuidelines.visuals.length === 0 ? 'empty' : 'success',
      );
    } catch (error) {
      setGuidelines({ requirements: [], visuals: [] });
      setErrorMessage(
        error instanceof Error && error.message
          ? error.message
          : 'Unable to load passport photo guidelines.',
      );
      setState('error');
    }
  }, []);

  useEffect(() => {
    void loadGuidelines();
  }, [loadGuidelines]);

  return (
    <section
      aria-labelledby="passport-guidelines-title"
      className="rounded-lg border border-slate-300 bg-white p-6 text-slate-950 shadow-sm"
    >
      <div className="mb-6">
        <h2 id="passport-guidelines-title" className="text-2xl font-semibold text-slate-950">
          Passport photo guidelines
        </h2>
        <p className="mt-2 text-sm text-slate-700">
          Review the official photo requirements and examples before uploading your image.
        </p>
      </div>

      <div aria-live="polite" aria-atomic="true" className="mb-4 min-h-6 text-sm font-medium text-slate-900">
        {state === 'loading' && <p role="status">Loading passport photo guidelines…</p>}
        {state === 'error' && <p role="alert">{errorMessage}</p>}
        {state === 'empty' && <p role="status">No passport photo guidelines are available right now.</p>}
        {state === 'success' && hasContent && <p role="status">Passport photo guidelines loaded.</p>}
      </div>

      {state === 'error' && (
        <div
          aria-label="Passport guidelines error"
          className="rounded-md border border-red-300 bg-red-50 p-4 text-red-900"
        >
          <p className="text-sm">Please try again to view the latest passport photo requirements.</p>
          <button
            type="button"
            onClick={() => {
              void loadGuidelines();
            }}
            className="mt-3 inline-flex items-center rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white outline-none transition hover:bg-red-800 focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
          >
            Retry loading guidelines
          </button>
        </div>
      )}

      {state === 'empty' && (
        <div
          aria-label="Passport guidelines unavailable"
          className="rounded-md border border-slate-300 bg-slate-50 p-4 text-slate-900"
        >
          <p className="text-sm">Requirements and visual examples will appear here when available.</p>
        </div>
      )}

      {state === 'success' && hasContent && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section
            aria-labelledby="passport-requirements-heading"
            className="rounded-md border border-slate-300 bg-slate-50 p-4"
          >
            <h3 id="passport-requirements-heading" className="text-lg font-semibold text-slate-950">
              Requirements
            </h3>
            <dl className="mt-4 space-y-3">
              {guidelines.requirements.map((requirement) => (
                <div key={requirement.id} className="rounded-md border border-slate-200 bg-white p-3">
                  <dt className="text-sm font-semibold text-slate-950">{requirement.label}</dt>
                  <dd className="mt-1 text-sm text-slate-800">{requirement.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section
            aria-labelledby="passport-visuals-heading"
            className="rounded-md border border-slate-300 bg-slate-50 p-4"
          >
            <h3 id="passport-visuals-heading" className="text-lg font-semibold text-slate-950">
              Visual examples
            </h3>
            <ul className="mt-4 space-y-4">
              {guidelines.visuals.map((visual) => {
                const hasImage = visual.imageUrl.trim().length > 0;
                const altText = visual.altText.trim().length > 0 ? visual.altText : `${visual.title} example`;

                return (
                  <li key={visual.id} className="overflow-hidden rounded-md border border-slate-200 bg-white">
                    {hasImage ? (
                      <img
                        src={visual.imageUrl}
                        alt={altText}
                        className="h-48 w-full bg-slate-200 object-cover"
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        className="flex h-48 w-full items-center justify-center bg-slate-200 text-sm font-medium text-slate-700"
                      >
                        Visual preview unavailable
                      </div>
                    )}
                    <div className="p-3">
                      <p className="text-sm font-semibold text-slate-950">{visual.title}</p>
                      {!hasImage && visual.altText.trim().length > 0 ? (
                        <p className="mt-1 text-sm text-slate-800">{visual.altText}</p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      )}
    </section>
  );
}
