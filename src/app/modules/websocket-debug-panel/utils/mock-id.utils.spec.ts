import { generateMockId, mockIdGenerators, enclosureMockIds } from './mock-id.utils';

describe('mock-id.utils', () => {
  describe('generateMockId', () => {
    it('should generate mock ID with correct format', () => {
      expect(generateMockId('enclosure', 'dashboard')).toBe('enclosure-mock-dashboard');
      expect(generateMockId('job', 'query')).toBe('job-mock-query');
      expect(generateMockId('alert', 'dismiss')).toBe('alert-mock-dismiss');
    });

    it('should handle kebab-case endpoints', () => {
      expect(generateMockId('enclosure', 'is-ix-hardware')).toBe('enclosure-mock-is-ix-hardware');
      expect(generateMockId('system', 'main-dashboard-sys-info')).toBe('system-mock-main-dashboard-sys-info');
    });
  });

  describe('mockIdGenerators', () => {
    it('should generate feature-specific mock IDs', () => {
      expect(mockIdGenerators.enclosure('dashboard')).toBe('enclosure-mock-dashboard');
      expect(mockIdGenerators.job('update')).toBe('job-mock-update');
      expect(mockIdGenerators.alert('list')).toBe('alert-mock-list');
      expect(mockIdGenerators.system('info')).toBe('system-mock-info');
    });
  });

  describe('enclosureMockIds', () => {
    it('should have predefined enclosure mock IDs', () => {
      expect(enclosureMockIds.dashboard).toBe('enclosure-mock-dashboard');
      expect(enclosureMockIds.isIxHardware).toBe('enclosure-mock-is-ix-hardware');
      expect(enclosureMockIds.systemInfo).toBe('enclosure-mock-system-info');
      expect(enclosureMockIds.mainDashboardSysInfo).toBe('enclosure-mock-main-dashboard-sys-info');
    });
  });
});
