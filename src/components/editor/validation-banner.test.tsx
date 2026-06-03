import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { createPhotoStore } from "../../store/photo-store";
import type { ValidationFailure } from "../../types/entities";
import { ValidationBanner } from "./validation-banner";

const validationFailures: ValidationFailure[] = [
  {
    type: "face_not_detected",
    detail: "A face could not be detected in the uploaded image.",
  },
  {
    type: "low_resolution",
    detail: "The uploaded image must be at least 1024x1024 pixels.",
  },
];

describe("ValidationBanner", () => {
  it("renders nothing when the store has no validation failures", () => {
    const store = createPhotoStore();

    expect(renderToStaticMarkup(<ValidationBanner store={store} />)).toBe("");
  });

  it("renders validation failures from the store with matching error labels and icons", () => {
    const store = createPhotoStore();

    validationFailures.forEach((failure) => {
      store.getState().addValidationFailure(failure);
    });

    const markup = renderToStaticMarkup(<ValidationBanner store={store} />);

    expect(markup).toContain("Validation failed");
    expect(markup).toContain("Face not detected");
    expect(markup).toContain("Low resolution");
    expect(markup).toContain(validationFailures[0].detail);
    expect(markup).toContain(validationFailures[1].detail);
    expect(markup).toContain('data-icon="scan-face"');
    expect(markup).toContain('data-icon="image-off"');
  });

  it("announces validation failures through an accessible live region", () => {
    const store = createPhotoStore();

    store.getState().addValidationFailure({
      type: "unexpected_error",
      detail: "The image could not be validated because the backend timed out.",
    });

    const markup = renderToStaticMarkup(<ValidationBanner store={store} />);

    expect(markup).toContain('role="alert"');
    expect(markup).toContain('aria-live="assertive"');
    expect(markup).toContain('aria-atomic="true"');
    expect(markup).toContain("The uploaded image has 1 validation failure.");
    expect(markup).toContain('aria-label="Validation failures"');
    expect(markup).toContain('data-icon="triangle-alert"');
  });
});
