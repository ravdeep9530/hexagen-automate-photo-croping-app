import * as React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Download } from "lucide-react";

import { downloadCroppedPhoto as defaultDownloadCroppedPhoto } from "../../lib/api-client";
import type {
  ApiError,
  ApiResult,
  DownloadCroppedPhotoResponse,
  ProcessedPhoto,
} from "../../types/entities";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { ErrorBanner } from "./error-banner";

const screenReaderOnlyClassName =
  "absolute h-px w-px -m-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0,0,0,0)]";

interface BrowserDownloadDependencies {
  createObjectURL: (blob: Blob) => string;
  document: Document;
  revokeObjectURL: (url: string) => void;
}

export interface DownloadPanelProps {
  className?: string;
  downloadCroppedPhoto?: typeof defaultDownloadCroppedPhoto;
  filename?: string;
  onDownloadComplete?: (response: DownloadCroppedPhotoResponse) => void;
  photo: ProcessedPhoto;
}

export function triggerBrowserDownload(
  response: DownloadCroppedPhotoResponse,
  dependencies: BrowserDownloadDependencies = {
    createObjectURL: URL.createObjectURL.bind(URL),
    document,
    revokeObjectURL: URL.revokeObjectURL.bind(URL),
  },
): void {
  const objectUrl = dependencies.createObjectURL(response.file);
  const anchor = dependencies.document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = response.filename;
  anchor.rel = "noopener";
  anchor.style.display = "none";

  dependencies.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  dependencies.revokeObjectURL(objectUrl);
}

function getPreferredFilename(photo: ProcessedPhoto, filename?: string): string {
  return filename ?? `processed-${photo.id}.jpg`;
}

function SuccessBanner({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      initial={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      <Alert
        aria-atomic="true"
        aria-live="polite"
        className="border-emerald-200 bg-emerald-50 text-emerald-950 [&>svg]:text-emerald-600"
        role="status"
      >
        {children}
      </Alert>
    </motion.div>
  );
}

export default function DownloadPanel({
  className,
  downloadCroppedPhoto = defaultDownloadCroppedPhoto,
  filename,
  onDownloadComplete,
  photo,
}: DownloadPanelProps): React.JSX.Element {
  const [error, setError] = React.useState<ApiError | null>(null);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState("");
  const preferredFilename = getPreferredFilename(photo, filename);
  const descriptionId = React.useId();
  const statusId = React.useId();

  const handleDownload = React.useCallback(async () => {
    setError(null);
    setSuccessMessage("");
    setIsDownloading(true);

    const result: ApiResult<DownloadCroppedPhotoResponse> = await downloadCroppedPhoto({
      photo_id: photo.id,
    });

    if (!result.ok) {
      setError(result.error);
      setIsDownloading(false);
      return;
    }

    triggerBrowserDownload(result.data);
    setError(null);
    setSuccessMessage(`${result.data.filename} downloaded successfully.`);
    setIsDownloading(false);
    onDownloadComplete?.(result.data);
  }, [downloadCroppedPhoto, onDownloadComplete, photo.id]);

  return (
    <section
      aria-labelledby="download-panel-title"
      className={["space-y-4 rounded-lg border border-slate-200 bg-white p-4", className]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="space-y-1">
        <h2 className="text-lg font-semibold" id="download-panel-title">
          Download processed photo
        </h2>
        <p className="text-sm text-slate-600" id={descriptionId}>
          Your cropped photo is ready. Download it as {preferredFilename}.
        </p>
      </div>

      <div className="rounded-md bg-slate-50 px-3 py-2 text-sm">
        <span className="font-medium">Filename:</span>{" "}
        <span data-testid="download-filename">{preferredFilename}</span>
      </div>

      {successMessage.length > 0 ? (
        <SuccessBanner>
          <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
          <AlertTitle>Download complete</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </SuccessBanner>
      ) : null}
      <ErrorBanner error={error} operation="download" />

      <button
        aria-busy={isDownloading}
        aria-describedby={`${descriptionId} ${statusId}`}
        aria-label={`Download processed photo ${preferredFilename}`}
        className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isDownloading}
        onClick={() => void handleDownload()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.currentTarget.click();
          }
        }}
        type="button"
      >
        <Download aria-hidden="true" className="h-4 w-4" />
        {isDownloading ? "Downloading…" : "Download photo"}
      </button>

      <p aria-live="polite" className={screenReaderOnlyClassName} id={statusId}>
        {isDownloading
          ? "Downloading processed photo."
          : successMessage || error?.message || "Download panel ready."}
      </p>
    </section>
  );
}
