'use client';

import React from 'react';
import type { FaceDetectionResult } from '../ai/face-detection';

export interface GuideOverlayProps {
  width: number;
  height: number;
  /** Existing guide toggle */
  showGuides?: boolean;
  /** Optional face/eye overlay toggle */
  showFaceGuides?: boolean;
  faceDetection?: FaceDetectionResult | null;
  className?: string;
}

/**
 * Passport-style preview guide overlay. It can render general crop guides and,
 * when enabled, detected face bounding boxes and eye positions.
 */
export function GuideOverlay({
  width,
  height,
  showGuides = true,
  showFaceGuides = false,
  faceDetection,
  className = '',
}: GuideOverlayProps): JSX.Element | null {
  if (!showGuides && !showFaceGuides) return null;

  const face = faceDetection?.faces[0];
  const canRenderFace = showFaceGuides && faceDetection && faceDetection.faceCount === 1 && face;

  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Photo positioning guides"
      data-testid="guide-overlay"
      preserveAspectRatio="none"
    >
      {showGuides && (
        <g opacity="0.75" data-testid="general-guides">
          <line x1={width / 2} x2={width / 2} y1="0" y2={height} stroke="currentColor" strokeDasharray="6 6" strokeWidth="1" />
          <line y1={height / 2} y2={height / 2} x1="0" x2={width} stroke="currentColor" strokeDasharray="6 6" strokeWidth="1" />
          <ellipse
            cx={width / 2}
            cy={height * 0.43}
            rx={width * 0.24}
            ry={height * 0.32}
            fill="none"
            stroke="currentColor"
            strokeDasharray="8 8"
            strokeWidth="1.5"
          />
          <line x1={width * 0.28} x2={width * 0.72} y1={height * 0.42} y2={height * 0.42} stroke="currentColor" strokeDasharray="4 4" strokeWidth="1" />
        </g>
      )}

      {canRenderFace && (
        <g data-testid="face-guides">
          <rect
            x={face.boundingBox.x}
            y={face.boundingBox.y}
            width={face.boundingBox.width}
            height={face.boundingBox.height}
            rx="6"
            fill="none"
            stroke="rgb(34 197 94)"
            strokeWidth="2"
          />
          <circle
            cx={face.boundingBox.x + face.boundingBox.width / 2}
            cy={face.boundingBox.y + face.boundingBox.height / 2}
            r="4"
            fill="rgb(34 197 94)"
          />
          {face.eyes && (
            <g data-testid="eye-guides">
              <line
                x1={face.eyes.left.x}
                y1={face.eyes.left.y}
                x2={face.eyes.right.x}
                y2={face.eyes.right.y}
                stroke="rgb(59 130 246)"
                strokeWidth="2"
              />
              <circle cx={face.eyes.left.x} cy={face.eyes.left.y} r="4" fill="rgb(59 130 246)" />
              <circle cx={face.eyes.right.x} cy={face.eyes.right.y} r="4" fill="rgb(59 130 246)" />
            </g>
          )}
        </g>
      )}
    </svg>
  );
}

export default GuideOverlay;
