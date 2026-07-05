export const BUILD_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function buildTimeoutErrorMessage(): string {
  return `Build timed out after ${BUILD_TIMEOUT_MS / 60_000} minutes`;
}
