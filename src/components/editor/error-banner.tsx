import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CircleAlert, ServerCrash, WifiOff } from "lucide-react";

import type { ApiError } from "../../types/entities";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

const screenReaderOnlyClassName =
  "absolute h-px w-px -m-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0,0,0,0)]";

const bannerMotionProps = {
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  initial: { opacity: 0, y: -8 },
  transition: { duration: 0.18, ease: "easeOut" as const },
};

const operationCopy = {
  crop: {
    action: "crop the image",
    label: "Crop",
  },
  download: {
    action: "download the processed photo",
    label: "Download",
  },
  upload: {
    action: "upload the image",
    label: "Upload",
  },
  validation: {
    action: "validate the image",
    label: "Validation",
  },
} as const;

export type ErrorBannerOperation = keyof typeof operationCopy;

export interface ErrorBannerProps {
  error: ApiError | null;
  operation: ErrorBannerOperation;
}

interface ErrorBannerPresentation {
  dataIcon: string;
  description: string;
  title: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

function getPresentation(
  error: ApiError,
  operation: ErrorBannerOperation,
): ErrorBannerPresentation {
  const copy = operationCopy[operation];

  if (error.status === 0 || error.code === "network_error") {
    return {
      dataIcon: "wifi-off",
      description: `We couldn't ${copy.action} because the connection was interrupted. Check your internet connection and try again.`,
      Icon: WifiOff,
      title: "Connection problem",
    };
  }

  if (error.status >= 500) {
    return {
      dataIcon: "server-crash",
      description: `The server couldn't ${copy.action} right now. Try again in a moment.`,
      Icon: ServerCrash,
      title: `${copy.label} unavailable`,
    };
  }

  return {
    dataIcon: "circle-alert",
    description: error.message,
    Icon: CircleAlert,
    title: `${copy.label} error`,
  };
}

export function ErrorBanner({
  error,
  operation,
}: ErrorBannerProps): React.JSX.Element | null {
  if (error === null) {
    return null;
  }

  const presentation = getPresentation(error, operation);

  return (
    <AnimatePresence initial={false}>
      <motion.div {...bannerMotionProps}>
        <Alert aria-atomic="true" aria-live="assertive" role="alert">
          <presentation.Icon
            aria-hidden="true"
            className="h-4 w-4"
            data-icon={presentation.dataIcon}
          />
          <AlertTitle>{presentation.title}</AlertTitle>
          <AlertDescription>
            <p>{presentation.description}</p>
            <p className={screenReaderOnlyClassName}>
              {`${presentation.title}. ${presentation.description}`}
            </p>
          </AlertDescription>
        </Alert>
      </motion.div>
    </AnimatePresence>
  );
}
