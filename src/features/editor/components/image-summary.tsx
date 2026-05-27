import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ImageAsset } from '@/domain';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface ImageSummaryProps {
  asset: ImageAsset | null;
}

export function ImageSummary({ asset }: ImageSummaryProps): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Selected image</CardTitle>
        <CardDescription>Basic file details used for validation and preview.</CardDescription>
      </CardHeader>
      <CardContent>
        {asset ? (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="col-span-2 flex items-center justify-between gap-3 rounded-md bg-muted/60 p-3">
              <dt className="font-medium">File</dt>
              <dd className="truncate text-right text-muted-foreground">{asset.name}</dd>
            </div>
            <div className="rounded-md border p-3">
              <dt className="text-muted-foreground">Dimensions</dt>
              <dd className="mt-1 font-medium">{asset.metadata.width} × {asset.metadata.height}px</dd>
            </div>
            <div className="rounded-md border p-3">
              <dt className="text-muted-foreground">Size</dt>
              <dd className="mt-1 font-medium">{formatBytes(asset.metadata.fileSizeBytes)}</dd>
            </div>
            <div className="rounded-md border p-3">
              <dt className="text-muted-foreground">Format</dt>
              <dd className="mt-1 font-medium uppercase">{asset.metadata.format}</dd>
            </div>
            <div className="rounded-md border p-3">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="mt-1"><Badge variant="secondary">{asset.status}</Badge></dd>
            </div>
          </dl>
        ) : (
          <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Upload a JPG, PNG, or WebP image to see its summary here.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
