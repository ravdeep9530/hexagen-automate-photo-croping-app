'use client';

import React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { BackgroundRemovalStatus as RemovalStatus } from '../ai/background-removal';

interface BackgroundRemovalStatusProps {
  status: RemovalStatus;
  progress?: number;
  message?: string;
  onCancel?: () => void;
  onRetry?: () => void;
  className?: string;
}

const LABELS: Record<RemovalStatus, string> = {
  idle: 'Background removal is ready',
  loading: 'Loading background removal…',
  processing: 'Removing background locally…',
  complete: 'Background removed',
  failed: 'Background removal unavailable',
};

export function BackgroundRemovalStatus({
  status,
  progress = 0,
  message,
  onCancel,
  onRetry,
  className,
}: BackgroundRemovalStatusProps): React.JSX.Element | null {
  if (status === 'idle') return null;

  const percent = Math.round(Math.max(0, Math.min(1, progress)) * 100);
  const busy = status === 'loading' || status === 'processing';

  return (
    <aside
      className={cn('rounded-lg border bg-card p-3 text-sm shadow-sm', className)}
      role={status === 'failed' ? 'alert' : 'status'}
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="font-medium text-card-foreground">{LABELS[status]}</p>
          <p className="text-xs text-muted-foreground">
            {message ?? (busy ? 'This happens on your device. No photo data is uploaded.' : 'You can keep editing other background modes.')}
          </p>
        </div>
        {busy && onCancel ? (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        ) : null}
        {status === 'failed' && onRetry ? (
          <Button type="button" variant="secondary" size="sm" onClick={onRetry}>Try again</Button>
        ) : null}
      </div>
      {busy ? (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" aria-label={`Background removal ${percent}% complete`}>
          <div className="h-full bg-primary transition-all" style={{ width: `${status === 'loading' ? 15 : Math.max(10, percent)}%` }} />
        </div>
      ) : null}
    </aside>
  );
}

export default BackgroundRemovalStatus;
