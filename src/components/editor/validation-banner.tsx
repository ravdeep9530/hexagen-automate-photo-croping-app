import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { BadgeAlert, ImageOff, ScanFace, TriangleAlert } from "lucide-react";
import type { StoreApi } from "zustand/vanilla";

import { photoStore, type PhotoStore } from "../../store/photo-store";
import type { ValidationFailure } from "../../types/entities";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

const screenReaderOnlyClassName =
  "absolute h-px w-px -m-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0,0,0,0)]";

interface ValidationFailurePresentation {
  iconName: string;
  Icon: LucideIcon;
  label: string;
}

const defaultFailurePresentation: ValidationFailurePresentation = {
  iconName: "triangle-alert",
  Icon: TriangleAlert,
  label: "Validation error",
};

const failurePresentations: Record<string, ValidationFailurePresentation> = {
  face_not_detected: {
    iconName: "scan-face",
    Icon: ScanFace,
    label: "Face not detected",
  },
  image_too_small: {
    iconName: "image-off",
    Icon: ImageOff,
    label: "Image too small",
  },
  low_resolution: {
    iconName: "image-off",
    Icon: ImageOff,
    label: "Low resolution",
  },
  multiple_faces_detected: {
    iconName: "badge-alert",
    Icon: BadgeAlert,
    label: "Multiple faces detected",
  },
};

export interface ValidationBannerProps {
  store?: StoreApi<PhotoStore>;
}

function getFailurePresentation(type: ValidationFailure["type"]): ValidationFailurePresentation {
  return failurePresentations[type] ?? defaultFailurePresentation;
}

export function ValidationBanner({
  store = photoStore,
}: ValidationBannerProps): React.JSX.Element | null {
  const validations = React.useSyncExternalStore(
    store.subscribe,
    () => store.getState().validations,
    () => store.getState().validations,
  );

  if (validations.length === 0) {
    return null;
  }

  return (
    <Alert aria-atomic="true" aria-live="assertive" role="alert">
      <TriangleAlert aria-hidden="true" className="h-4 w-4" />
      <AlertTitle>Validation failed</AlertTitle>
      <AlertDescription>
        <p className={screenReaderOnlyClassName}>
          {`The uploaded image has ${validations.length} validation ${
            validations.length === 1 ? "failure" : "failures"
          }.`}
        </p>
        <ul aria-label="Validation failures" className="mt-3 space-y-3">
          {validations.map((failure, index) => {
            const presentation = getFailurePresentation(failure.type);

            return (
              <li
                key={`${failure.type}-${failure.detail}-${index}`}
                className="flex items-start gap-2"
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-red-600"
                  data-icon={presentation.iconName}
                >
                  <presentation.Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-medium">{presentation.label}</p>
                  <p>{failure.detail}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
