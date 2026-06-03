import { useEffect, useState } from "react";

import { checkCroppingFeatureFlag as defaultCheckCroppingFeatureFlag } from "../lib/api-client";
import type { ApiClientResult, CroppingFeatureFlagResponse } from "../types/entities";

export interface UseFeatureFlagApiClient {
  checkCroppingFeatureFlag: (userId?: string | null) => Promise<ApiClientResult<CroppingFeatureFlagResponse>>;
}

export interface UseFeatureFlagResult {
  enabled: boolean;
  loading: boolean;
  errorMessage: string | null;
}

export const useFeatureFlag = (
  userId?: string | null,
  apiClient: UseFeatureFlagApiClient = {
    checkCroppingFeatureFlag: defaultCheckCroppingFeatureFlag,
  },
): UseFeatureFlagResult => {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setErrorMessage(null);

    void apiClient.checkCroppingFeatureFlag(userId).then((result) => {
      if (!active) {
        return;
      }

      if (result.error) {
        setEnabled(false);
        setErrorMessage(result.error.message);
        setLoading(false);
        return;
      }

      setEnabled(result.data.enabled);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [apiClient, userId]);

  return {
    enabled,
    loading,
    errorMessage,
  };
};
