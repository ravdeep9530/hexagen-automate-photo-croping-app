import { AlertCircle, Loader2, ScissorsOff } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

export interface FeatureFlagBannerProps {
  loading?: boolean;
  enabled?: boolean;
  errorMessage?: string | null;
}

export const FeatureFlagBanner = ({
  loading = false,
  enabled = false,
  errorMessage = null,
}: FeatureFlagBannerProps) => {
  if (enabled) {
    return null;
  }

  if (loading) {
    return (
      <Alert aria-live="polite" className="border-border/60 bg-muted/40">
        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
        <AlertTitle>Checking cropping access</AlertTitle>
        <AlertDescription>We are confirming whether the cropping tool is enabled for this user.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert aria-live="polite" className="border-amber-500/40 bg-amber-500/5">
      {errorMessage ? <AlertCircle aria-hidden="true" className="h-4 w-4" /> : <ScissorsOff aria-hidden="true" className="h-4 w-4" />}
      <AlertTitle>Cropping tool unavailable</AlertTitle>
      <AlertDescription>
        {errorMessage ?? "The cropping tool is currently disabled for this account. Please try again later."}
      </AlertDescription>
    </Alert>
  );
};
