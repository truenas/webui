/**
 * Utility for generating consistent mock configuration IDs
 */

/** Builds a mock ID in the form `{feature}-mock-{endpoint}`, e.g. `enclosure-mock-dashboard`. */
export function generateMockId(feature: string, endpoint: string): string {
  return `${feature}-mock-${endpoint}`;
}

/**
 * Type-safe mock ID generator for known features
 */
export const mockIdGenerators = {
  enclosure: (endpoint: string) => generateMockId('enclosure', endpoint),
  job: (endpoint: string) => generateMockId('job', endpoint),
  alert: (endpoint: string) => generateMockId('alert', endpoint),
  system: (endpoint: string) => generateMockId('system', endpoint),
} as const;

/**
 * Predefined mock IDs for common enclosure endpoints
 */
export const enclosureMockIds = {
  dashboard: mockIdGenerators.enclosure('dashboard'),
  // No longer registered (`truenas.is_ix_hardware` is on the typed client); kept so disabling the
  // mock still clears an entry persisted by an older build.
  isIxHardware: mockIdGenerators.enclosure('is-ix-hardware'),
  systemInfo: mockIdGenerators.enclosure('system-info'),
  mainDashboardSysInfo: mockIdGenerators.enclosure('main-dashboard-sys-info'),
} as const;
