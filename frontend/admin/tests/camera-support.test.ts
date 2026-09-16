import { describe, expect, test } from "bun:test";
import { detectCameraIssue } from "../app/utils/camera-support";

describe("detectCameraIssue", () => {
  test("rejects an HTTP LAN origin before the scanner calls getUserMedia", () => {
    expect(detectCameraIssue({ isSecureContext: false, hasGetUserMedia: false })).toBe("insecure-context");
  });

  test("reports an unsupported browser on a secure origin", () => {
    expect(detectCameraIssue({ isSecureContext: true, hasGetUserMedia: false })).toBe("unsupported-browser");
  });

  test("allows camera access on HTTPS when getUserMedia is available", () => {
    expect(detectCameraIssue({ isSecureContext: true, hasGetUserMedia: true })).toBeNull();
  });
});
