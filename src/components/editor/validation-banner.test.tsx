// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { createPhotoStore } from "../../store/photo-store";
import type { ValidationFailure } from "../../types/entities";
import { ValidationBanner } from "./validation-banner";

const validationFailures: ValidationFailure[] = [
  {
    imageId: "image-1",
    code: "min_resolution",
    message: "The uploaded image is too small.",
  },
  {
    imageId: "image-1",
    code: "unsupported_media_type",
    message: "Only JPEG images are supported.",
  },
  {
    imageId: "image-1",
    code: "unexpected_error",
    message: "Validation could not be completed.",
  },
];

afterEach(() => {
  cleanup();
});

describe("validation-banner", () => {
  it("renders nothing when the photo store has no validation failures", () => {
    const store = createPhotoStore();
    const { container } = render(<ValidationBanner store={store} />);

    expect(container.innerHTML).toBe("");
  });

  it("renders validation failures with an accessible live-region summary", () => {
    const store = createPhotoStore();

    act(() => {
      const state = store.getState();

      validationFailures.forEach((failure) => {
        state.addValidationFailure(failure);
      });
    });

    render(<ValidationBanner store={store} />);

    const alert = screen.getByRole("alert");
    const list = screen.getByRole("list", { name: "Validation failures" });

    expect(alert.getAttribute("aria-live")).toBe("assertive");
    expect(alert.getAttribute("aria-atomic")).toBe("true");
    expect(screen.getByText("Validation failed")).toBeTruthy();
    expect(screen.getByText("3 validation failures need attention.")).toBeTruthy();
    expect(list.children).toHaveLength(3);
    expect(list.children[0]?.textContent).toBe("Image validation error: The uploaded image is too small.");
    expect(list.children[1]?.textContent).toBe("File validation error: Only JPEG images are supported.");
    expect(list.children[2]?.textContent).toBe("Validation error: Validation could not be completed.");
  });

  it("subscribes to store updates and announces new validation failures", () => {
    const store = createPhotoStore();

    render(<ValidationBanner store={store} />);

    expect(screen.queryByRole("alert")).toBeNull();

    act(() => {
      store.getState().addValidationFailure(validationFailures[0]);
    });

    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText("1 validation failure needs attention.")).toBeTruthy();
  });
});
