/**
 * Reference "now" for the mock data so server and client render identical
 * relative times. Swap to `() => Date.now()` once a real API is connected.
 */
export const NOW = new Date("2026-10-01T12:00:00+05:30").getTime();
export const now = () => NOW;
