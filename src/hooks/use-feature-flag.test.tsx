import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import {
  initialFeatureFlagState,
  resolveFeatureFlagState,
  useFeatureFlag,
} from "./use-feature-flag";
import type { ApiResult, CheckCroppingFeatureFlagResponse } from "../types/entities";

function TestComponent({
  checkFeatureFlag,
  userId,
}: {
  checkFeatureFlag: (request?: { user_id?: string | null }) => Promise<ApiResult<CheckCroppingFeatureFlagResponse>>;
  userId?: string | null;
}): React.JSX.Element {
  const featureFlag = useFeatureFlag({ checkFeatureFlag, userId });

  return (
    <output aria-label="feature-flag-state">
      {`${featureFlag.status}|${String(featureFlag.enabled)}|${featureFlag.errorMessage ?? "none"}`}
    </output>
  );
}

describe("useFeatureFlag", () => {
  it("starts in loading state before the feature flag request resolves", () => {
    const checkFeatureFlag = vi.fn<
      (request?: { user_id?: string | null }) => Promise<ApiResult<CheckCroppingFeatureFlagResponse>>
    >().mockResolvedValue({
      data: { enabled: true },
      ok: true,
      status: 200,
    });

    const markup = renderToStaticMarkup(
      <TestComponent checkFeatureFlag={checkFeatureFlag} userId="user-1" />,
    );

    expect(markup).toContain("loading|false|none");
  });

  it("maps enabled, disabled, and error responses into stable feature-flag state", () => {
    expect(initialFeatureFlagState).toEqual({
      enabled: false,
      errorMessage: null,
      status: "loading",
    });

    expect(
      resolveFeatureFlagState({
        data: { enabled: true },
        ok: true,
        status: 200,
      }),
    ).toEqual({
      enabled: true,
      errorMessage: null,
      status: "enabled",
    });

    expect(
      resolveFeatureFlagState({
        data: { enabled: false },
        ok: true,
        status: 200,
      }),
    ).toEqual({
      enabled: false,
      errorMessage: null,
      status: "disabled",
    });

    expect(
      resolveFeatureFlagState({
        error: {
          code: "feature_flag_check_failed",
          message: "Feature flag service unavailable.",
          status: 503,
        },
        ok: false,
        status: 503,
      }),
    ).toEqual({
      enabled: false,
      errorMessage: "Feature flag service unavailable.",
      status: "error",
    });
  });
});
