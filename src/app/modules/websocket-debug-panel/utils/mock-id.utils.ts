/**
 * Utility for generating consistent mock configuration IDs
 */

/**
 * Generates a standardized mock ID for a given feature and endpoint
 * @param feature The feature name (e.g., 'enclosure', 'job', 'alert')
 * @param endpoint The endpoint or identifier (e.g., 'dashboard', 'query')
 * @returns A kebab-case ID in the format: '{feature}-mock-{endpoint}'
 * @example
 * generateMockId('enclosure', 'dashboard') // 'enclosure-mock-dashboard'
 * generateMockId('job', 'update') // 'job-mock-update'
 */
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
  isIxHardware: mockIdGenerators.enclosure('is-ix-hardware'),
  systemInfo: mockIdGenerators.enclosure('system-info'),
  mainDashboardSysInfo: mockIdGenerators.enclosure('main-dashboard-sys-info'),
} as const;
