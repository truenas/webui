import { formatValue } from 'app/pages/reports-dashboard/utils/report.utils';

describe('formatValue', () => {
  it('returns default value', () => {
    expect(formatValue(500000000, 'test_unknown')).toBe('500m');
  });

  it('returns value for Seconds', () => {
    expect(formatValue(60 * 60 * 24 * 3, 'Seconds')).toBe('3 days');
  });

  it('returns value for Mebibytes', () => {
    expect(formatValue(500, 'Mebibytes')).toBe('500 MiB');
  });

  it('returns value for Kibibytes', () => {
    expect(formatValue(500, 'Kibibytes')).toBe('500 KiB');
  });

  it('returns value for Kilobits', () => {
    expect(formatValue(500, 'Kilobits')).toBe('500 kb');
  });

  it('returns value for bits', () => {
    expect(formatValue(500, 'bits')).toBe('500 B');
  });

  it('returns value for bytes', () => {
    expect(formatValue(500, 'bytes')).toBe('500 B');
  });
});
