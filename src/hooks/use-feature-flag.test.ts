import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync("src/hooks/use-feature-flag.ts", "utf8");

describe("use-feature-flag source", () => {
  it("checks the cropping feature flag on load and when user id changes", () => {
    expect(source).toContain("useEffect(() => {");
    expect(source).toContain("apiClient.checkCroppingFeatureFlag(userId)");
    expect(source).toContain("[apiClient, userId]");
    expect(source).toContain("setEnabled(result.data.enabled)");
    expect(source).toContain("setErrorMessage(result.error.message)");
  });
});
