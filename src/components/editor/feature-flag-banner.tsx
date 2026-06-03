import * as React from "react";

import type { FeatureFlagState } from "../../hooks/use-feature-flag";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

export interface FeatureFlagBannerProps {
  errorMessage?: string | null;
  status: FeatureFlagState["status"];
}

export function FeatureFlagBanner({
  errorMessage,
  status,
}: FeatureFlagBannerProps): React.JSX.Element | null {
  if (status === "enabled") {
    return null;
  }

  const message =
    status === "loading"
      ? "Checking whether cropping is available for this user."
      : status === "error"
        ? errorMessage ?? "Cropping is currently unavailable. Please try again later."
        : "Cropping is currently disabled for this user.";

  const title = status === "loading" ? "Checking crop access" : "Cropping unavailable";

  return (
    <Alert aria-live={status === "error" ? "assertive" : "polite"} role="status">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
