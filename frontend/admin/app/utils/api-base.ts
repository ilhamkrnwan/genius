export function resolveApiBase(configuredBase?: string): string {
  const fallback = configuredBase || "/api";
  if (typeof window === "undefined") return fallback;

  const pageHost = window.location.hostname;
  const pageIsLoopback = pageHost === "localhost" || pageHost === "127.0.0.1" || pageHost === "::1";

  try {
    const configuredHost = new URL(fallback).hostname;
    const configuredIsLoopback = configuredHost === "localhost" || configuredHost === "127.0.0.1" || configuredHost === "::1";
    if (configuredIsLoopback && !pageIsLoopback) {
      return `http://${pageHost}:3001/api`;
    }
  } catch {
    // Fall through to the configured value when it is not an absolute URL.
  }

  return fallback;
}
