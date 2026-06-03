import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync("src/hooks/use-crop-controls.ts", "utf8");

describe("use-crop-controls source", () => {
  it("defines keyboard arrow handling and aspect ratio helpers", () => {
    expect(source).toContain('"1:1"');
    expect(source).toContain("ArrowUp");
    expect(source).toContain("ArrowDown");
    expect(source).toContain("ArrowLeft");
    expect(source).toContain("ArrowRight");
    expect(source).toContain("getAspectRatioValue");
  });
});
