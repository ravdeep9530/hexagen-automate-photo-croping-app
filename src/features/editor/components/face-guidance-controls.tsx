'use client';

import React from 'react';
import { UserSquare2, Eye, EyeOff, AlertCircle, Info, CheckCircle2, XCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { FaceDetectionState } from '../hooks/use-face-detection';
import type { FaceGuidanceMessage, FaceGuidanceSeverity } from '../ai/face-detection';

export interface FaceGuidanceControlsProps {
  /** Whether face detection is enabled */
  faceDetectionEnabled: boolean;
  /** Whether face guides overlay is shown */
  showFaceGuides: boolean;
  /** Detection state */
  detection: FaceDetectionState;
  /** Toggle detection on/off */
  onToggleDetection: (enabled: boolean) => void;
  /** Toggle guides overlay */
  onToggleFaceGuides: (show: boolean) => void;
  /** Trigger a manual recheck (if desired by UI) */
  onRecheck?: () => void;
  className?: string;
}

function severityIcon(severity: FaceGuidanceSeverity) {
  switch (severity) {
    case 'success':
      return <CheckCircle2 className="h-3.5 w-3.5 text-green-600" aria-hidden="true" />;
    case 'warning':
      return <AlertCircle className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />;
    case 'error':
      return <XCircle className="h-3.5 w-3.5 text-red-600" aria-hidden="true" />;
    case 'info':
    default:
      return <Info className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />;
  }
}

function severityBadge(severity: FaceGuidanceSeverity) {
  switch (severity) {
    case 'success':
      return <Badge variant="outline" className="text-xs text-green-700 border-green-300 bg-green-50">Done</Badge>;
    case 'warning':
      return <Badge variant="outline" className="text-xs text-amber-700 border-amber-300 bg-amber-50">Check</Badge>;
    case 'error':
      return <Badge variant="destructive" className="text-xs">Issue</Badge>;
    case 'info':
    default:
      return <Badge variant="outline" className="text-xs text-blue-700 border-blue-300 bg-blue-50">Info</Badge>;
  }
}

export function FaceGuidanceControls({
  faceDetectionEnabled,
  showFaceGuides,
  detection,
  onToggleDetection,
  onToggleFaceGuides,
  onRecheck,
  className = '',
}: FaceGuidanceControlsProps): JSX.Element {
  const { status, result, guidance, isLoading } = detection;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-muted/30">
        <div className="flex items-center gap-2">
          <UserSquare2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Face Detection</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" align="start" className="max-w-xs">
                <p className="text-xs">Detection runs locally on your device. Enable to position head and eyes.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Switch
          checked={faceDetectionEnabled}
          onCheckedChange={onToggleDetection}
          aria-label={faceDetectionEnabled ? 'Disable face detection' : 'Enable face detection'}
          data-testid="face-detection-toggle"
        />
      </div>

      {faceDetectionEnabled && (
        <div className="px-1" data-testid="face-guidance-panel">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => onToggleFaceGuides(!showFaceGuides)}
              data-testid="toggle-face-guides-btn"
            >
              {showFaceGuides ? <EyeOff className="h-3.5 w-3.5 mr-1.5" /> : <Eye className="h-3.5 w-3.5 mr-1.5" />}
              {showFaceGuides ? 'Hide guides' : 'Show guides'}
            </Button>
            {onRecheck && detection.status !== 'loading' && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={onRecheck}
                data-testid="face-recheck-btn"
              >
                Recheck
              </Button>
            )}
          </div>

          <div className="mt-2 space-y-2">
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-3 w-3 animate-spin rounded-full border border-muted-foreground border-t-foreground" />
                Detecting...
              </div>
            )}

            {!isLoading && guidance.length === 0 && status === 'idle' && (
              <p className="text-xs text-muted-foreground">Upload an image to detect faces.</p>
            )}

            {!isLoading && guidance.map((g: FaceGuidanceMessage, idx: number) => (
              <div
                key={`${g.code}-${idx}`}
                className="flex items-start gap-2 rounded-md border-l-2 bg-muted/40 p-2"
                data-testid={`guidance-${g.severity}`}
                style={{
                  borderLeftColor:
                    g.severity === 'error' ? 'rgb(239 68 68)' : g.severity === 'warning' ? 'rgb(245 158 11)' : g.severity === 'success' ? 'rgb(34 197 94)' : 'rgb(59 130 246)',
                }}
              >
                <span className="mt-0.5 shrink-0">{severityIcon(g.severity)}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs leading-relaxed">{g.message}</p>
                </div>
                {severityBadge(g.severity)}
              </div>
            ))}

            {detection.result && (
              <div
                className="flex flex-wrap items-center gap-2 pt-1"
                data-testid="face-summary"
              >
                <Badge variant="secondary" className="text-xs">
                  {result?.status === 'detected' ? 'Detected' : result?.status === 'failed' ? 'Failed' : result?.status === 'not-detected' ? 'Not Found' : 'Unavailable'}
                </Badge>
                {typeof result?.confidence === 'number' && (
                  <span className="text-[10px] text-muted-foreground">
                    Confidence: {Math.round(result.confidence * 100)}%
                  </span>
                )}
                {result?.eyes && (
                  <span className="text-[10px] text-muted-foreground">Eyes: located</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FaceGuidanceControls;
