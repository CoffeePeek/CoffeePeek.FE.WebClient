/* Lightweight telemetry facade.
 * Replace implementation with Sentry/LogRocket/etc. when needed.
 */

export function captureException(error: unknown, context?: Record<string, unknown>) {
  // Keep prod logs minimal but still useful.
  // eslint-disable-next-line no-console
  console.error('Captured exception', { error, context });
}


