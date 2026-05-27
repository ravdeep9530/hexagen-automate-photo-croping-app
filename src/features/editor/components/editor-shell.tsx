'use client';

import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEditorStore } from '@/features/editor/store/editor-store';
import { ImageSummary } from './image-summary';
import { PresetSelector } from './preset-selector';
import { PrivacyLocalNotice } from './privacy-local-notice';
import { UploadDropzone } from './upload-dropzone';

export function EditorShell(): React.JSX.Element {
  const asset = useEditorStore((state) => state.asset);
  const imageObjectUrl = useEditorStore((state) => state.runtime.imageObjectUrl);
  const selectedPreset = useEditorStore((state) => state.selectedPreset);

  return (
    <main className="min-h-screen bg-muted/20">
      <div className="container mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge variant="secondary">Browser-only editor</Badge>
            <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Photo editor</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Upload a local photo, choose a passport or visa preset, and review the initial preview before crop and validation tools are added.
            </p>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className="space-y-6" aria-label="Upload and preview">
            <UploadDropzone />

            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>Initial preview integration for the selected local image.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex min-h-[360px] items-center justify-center rounded-lg border bg-background p-4">
                  {imageObjectUrl && asset ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageObjectUrl}
                      alt={`Preview of ${asset.name}`}
                      className="max-h-[520px] max-w-full rounded-md object-contain shadow-sm"
                    />
                  ) : (
                    <div className="max-w-sm text-center text-sm text-muted-foreground">
                      <div aria-hidden="true" className="mb-3 text-4xl">🖼️</div>
                      <p>Your browser preview appears here after upload. No server upload is required.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>

          <aside className="space-y-6" aria-label="Editor controls and guidance">
            <PrivacyLocalNotice />
            <PresetSelector />
            <ImageSummary asset={asset} />

            <Card>
              <CardHeader>
                <CardTitle>Guidance</CardTitle>
                <CardDescription>Best-effort setup checklist.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Start with a sharp, front-facing photo in even lighting.</li>
                  <li>• Pick the destination document preset before cropping.</li>
                  <li>• Automated checks are advisory and do not guarantee acceptance.</li>
                </ul>
                {selectedPreset ? (
                  <p className="mt-4 rounded-md bg-muted p-3 text-sm">
                    Active preset: <strong>{selectedPreset.name}</strong>
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}
