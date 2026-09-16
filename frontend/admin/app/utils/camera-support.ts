export type CameraIssue = "insecure-context" | "unsupported-browser" | null;

interface CameraEnvironment {
  isSecureContext: boolean;
  hasGetUserMedia: boolean;
}

export function detectCameraIssue(environment: CameraEnvironment): CameraIssue {
  if (!environment.isSecureContext) return "insecure-context";
  if (!environment.hasGetUserMedia) return "unsupported-browser";
  return null;
}

export function detectBrowserCameraIssue(): CameraIssue {
  if (typeof window === "undefined" || typeof navigator === "undefined") return null;

  return detectCameraIssue({
    isSecureContext: window.isSecureContext,
    hasGetUserMedia: typeof navigator.mediaDevices?.getUserMedia === "function",
  });
}
