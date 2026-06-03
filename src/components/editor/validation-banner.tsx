import { AlertCircle, FileWarning, ImageUpscale, TriangleAlert } from "lucide-react";
import { useId, useSyncExternalStore } from "react";

import type { PhotoStore } from "../../store/photo-store";
import type { ValidationFailure } from "../../types/entities";
import { photoStore } from "../../store/photo-store";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

export interface ValidationBannerProps {
  store?: PhotoStore;
}

const getFailurePresentation = (code: string) => {
  if (/(dimension|resolution|ratio|crop|size)/i.test(code)) {
    return {
      Icon: ImageUpscale,
      label: "Image validation error",
    };
  }

  if (/(format|media|mime|type|extension)/i.test(code)) {
    return {
      Icon: FileWarning,
      label: "File validation error",
    };
  }

  return {
    Icon: TriangleAlert,
    label: "Validation error",
  };
};

const getValidationSummary = (failures: ValidationFailure[]): string => {
  if (failures.length === 1) {
    return "1 validation failure needs attention.";
  }

  return `${failures.length} validation failures need attention.`;
};

export const ValidationBanner = ({ store = photoStore }: ValidationBannerProps) => {
  const failures = useSyncExternalStore(
    store.subscribe,
    () => store.getState().validations,
    () => store.getState().validations,
  );
  const titleId = useId();
  const descriptionId = useId();

  if (failures.length === 0) {
    return null;
  }

  return (
    <Alert
      aria-live="assertive"
      aria-atomic="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="border-destructive/60 bg-destructive/5"
    >
      <div className="flex items-start gap-3">
        <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <AlertTitle id={titleId}>Validation failed</AlertTitle>
          <AlertDescription id={descriptionId}>
            <p className="sr-only">{getValidationSummary(failures)}</p>
            <ul className="space-y-2" aria-label="Validation failures">
              {failures.map((failure, index) => {
                const { Icon: FailureIcon, label } = getFailurePresentation(failure.code);

                return (
                  <li
                    key={`${failure.imageId}:${failure.code}:${index}`}
                    className="flex items-start gap-2"
                  >
                    <FailureIcon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      <span className="sr-only">{label}: </span>
                      {failure.message}
                    </span>
                  </li>
                );
              })}
            </ul>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};
