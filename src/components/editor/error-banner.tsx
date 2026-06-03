"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, TriangleAlert, XCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import type { ApiClientError } from "../../types/entities";

export type ErrorBannerKind = "upload" | "validation" | "crop" | "download";

export interface ErrorBannerProps {
  error: ApiClientError | null;
  kind: ErrorBannerKind;
}

const getErrorTone = (error: ApiClientError) => {
  if (error.status === 0 || error.code === "network_error") {
    return {
      Icon: TriangleAlert,
      title: "Network error",
      message: "Check your connection and try again.",
      politeness: "assertive" as const,
    };
  }

  if (error.status >= 500) {
    return {
      Icon: XCircle,
      title: "Server error",
      message: "Our server hit a problem. Please try again in a moment.",
      politeness: "assertive" as const,
    };
  }

  return {
    Icon: AlertCircle,
    title: "Action required",
    message: error.message,
    politeness: "assertive" as const,
  };
};

const getKindTitle = (kind: ErrorBannerKind): string => {
  switch (kind) {
    case "upload":
      return "Upload failed";
    case "validation":
      return "Validation failed";
    case "crop":
      return "Crop failed";
    case "download":
      return "Download failed";
    default:
      return "Error";
  }
};

export const ErrorBanner = ({ error, kind }: ErrorBannerProps) => {
  return (
    <AnimatePresence mode="wait">
      {error ? (
        <motion.div
          key={`${kind}:${error.code}:${error.message}`}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {(() => {
            const tone = getErrorTone(error);
            const bannerTitle = getKindTitle(kind);
            const description =
              tone.title === "Action required"
                ? error.message
                : `${tone.message} ${error.message}`.trim();

            return (
              <Alert
                aria-live={tone.politeness}
                aria-atomic="true"
                className="border-destructive/60 bg-destructive/5"
              >
                <div className="flex items-start gap-3">
                  <tone.Icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <AlertTitle>{bannerTitle}</AlertTitle>
                    <AlertDescription>
                      <span className="sr-only">{tone.title}: </span>
                      {description}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            );
          })()}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
