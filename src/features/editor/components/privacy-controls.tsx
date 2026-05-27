'use client';

import React, { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSessionPersistence } from '@/features/editor/hooks/use-session-persistence';
import useEditorStore from '@/features/editor/store/editor-store';

interface PrivacyControlsProps {
  onClearData?: () => void;
}

export function PrivacyControls({ onClearData }: PrivacyControlsProps): React.JSX.Element {
  const {
    persistEnabled,
    hasSession,
    isHydrating,
    error,
    enablePersistence,
    disablePersistence,
    clearSession,
  } = useSessionPersistence();
  const resetEditor = useEditorStore((state) => state.resetEditor);
  const [isBusy, setIsBusy] = useState(false);
  const [noticeAcknowledged, setNoticeAcknowledged] = useState(false);

  const handleTogglePersistence = useCallback(async () => {
    setIsBusy(true);
    try {
      if (persistEnabled) {
        await disablePersistence();
      } else {
        setNoticeAcknowledged(true);
        await enablePersistence();
      }
    } finally {
      setIsBusy(false);
    }
  }, [disablePersistence, enablePersistence, persistEnabled]);

  const handleClearData = useCallback(async () => {
    setIsBusy(true);
    try {
      await clearSession();
      resetEditor();
      onClearData?.();
    } finally {
      setIsBusy(false);
    }
  }, [clearSession, onClearData, resetEditor]);

  const persistenceButtonLabel = persistEnabled ? 'Disable session saving' : 'Enable session saving';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Privacy &amp; local data</CardTitle>
        <CardDescription>
          Choose whether Hexagen should remember lightweight editor settings on this device.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="rounded-lg border p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold">Remember my session</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Saves theme, last preset, crop, processing, and export settings. Photos, blobs,
                files, ImageBitmaps, and object URLs are never saved by this control.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant={persistEnabled ? 'outline' : 'default'}
              onClick={handleTogglePersistence}
              disabled={isHydrating || isBusy}
              aria-pressed={persistEnabled}
            >
              {isBusy ? 'Working…' : persistenceButtonLabel}
            </Button>
          </div>

          {!persistEnabled && !noticeAcknowledged ? (
            <p className="mt-3 rounded-md bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
              Privacy notice: session persistence is opt-in. If enabled, only non-image metadata is
              stored locally in this browser.
            </p>
          ) : null}

          {hasSession ? (
            <p className="mt-3 text-xs text-muted-foreground">A saved editor session exists on this device.</p>
          ) : null}
        </div>

        <div className="rounded-lg border p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold">Clear local data</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Removes saved preferences and session metadata, then resets the editor state.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleClearData}
              disabled={isBusy || (!hasSession && !persistEnabled)}
            >
              Clear data
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
