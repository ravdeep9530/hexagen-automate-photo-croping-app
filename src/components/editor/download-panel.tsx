"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Download, Loader2, XCircle } from "lucide-react";
import { useId, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";

import { downloadCroppedPhoto as defaultDownloadCroppedPhoto } from "../../lib/api-client";
import type {
  ApiClientResult,
  DownloadCroppedPhotoResponse,
  ProcessedPhoto,
} from "../../types/entities";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

export interface DownloadPanelApiClient {
  downloadCroppedPhoto: (request: {
    photoId: string;
  }) => Promise<ApiClientResult<DownloadCroppedPhotoResponse>>;
}

export interface DownloadPanelProps {
  photo: ProcessedPhoto;
  apiClient?: DownloadPanelApiClient;
  className?: string;
  onDownloaded?: (photoId: string, filename: string) => void;
}

type DownloadStatus = "idle" | "downloading" | "success" | "error";

const cx = (...classNames: Array<string | false | null | undefined>): string =>
  classNames.filter(Boolean).join(" ");

const triggerBrowserDownload = (blob: Blob, filename: string) => {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
};

export const DownloadPanel = ({
  photo,
  apiClient = { downloadCroppedPhoto: defaultDownloadCroppedPhoto },
  className,
  onDownloaded,
}: DownloadPanelProps) => {
  const statusId = useId();
  const bannerId = useId();
  const [status, setStatus] = useState<DownloadStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const filename = photo.filename || "processed-photo.jpg";
  const isDownloading = status === "downloading";

  const handleDownload = async () => {
    if (isDownloading) {
      return;
    }

    setStatus("downloading");
    setMessage("Preparing your processed photo download.");

    const result = await apiClient.downloadCroppedPhoto({ photoId: photo.id });

    if (result.error) {
      setStatus("error");
      setMessage(result.error.message);
      return;
    }

    const downloadedFilename = result.data.filename ?? filename;

    triggerBrowserDownload(result.data.blob, downloadedFilename);
    setStatus("success");
    setMessage(`${downloadedFilename} downloaded successfully.`);
    onDownloaded?.(photo.id, downloadedFilename);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    void handleDownload();
  };

  const banner = status === "success" || status === "error" ? status : null;

  return (
    <section
      className={cx("space-y-4 rounded-xl border bg-card p-4", className)}
      aria-label="Download processed photo"
      aria-describedby={statusId}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-sm font-medium">Processed photo ready</h2>
          <p className="mt-1 truncate text-sm text-muted-foreground" title={filename}>
            {filename}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleDownload()}
          onKeyDown={handleKeyDown}
          disabled={isDownloading}
          aria-label={`Download processed photo ${filename}`}
          aria-describedby={[statusId, banner ? bannerId : null].filter(Boolean).join(" ")}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60"
        >
          {isDownloading ? (
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <Download aria-hidden="true" className="h-4 w-4" />
          )}
          <span>{isDownloading ? "Downloading…" : "Download"}</span>
        </button>
      </div>

      <p id={statusId} className="sr-only" aria-live="polite">
        {message ?? `Download ${filename} when you are ready.`}
      </p>

      <AnimatePresence mode="wait">
        {banner ? (
          <motion.div
            key={banner}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <Alert
              id={bannerId}
              aria-live={banner === "error" ? "assertive" : "polite"}
              aria-atomic="true"
              className={cx(
                banner === "success" && "border-emerald-500/60 bg-emerald-500/10 text-emerald-700",
                banner === "error" && "border-destructive/60 bg-destructive/5",
              )}
            >
              <div className="flex items-start gap-3">
                {banner === "success" ? (
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
                ) : (
                  <XCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
                )}
                <div>
                  <AlertTitle>{banner === "success" ? "Download started" : "Download failed"}</AlertTitle>
                  <AlertDescription>{message}</AlertDescription>
                </div>
              </div>
            </Alert>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
};
