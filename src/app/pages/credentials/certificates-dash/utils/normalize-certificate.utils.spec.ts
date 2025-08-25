import { normalizeCertificateNewlines } from './normalize-certificate.utils';

describe('normalizeCertificateNewlines', () => {
  it('converts escaped newlines to proper newlines', () => {
    const input = 'line1\\nline2\\nline3';
    const expected = 'line1\nline2\nline3';

    expect(normalizeCertificateNewlines(input)).toBe(expected);
  });

  it('handles certificate data with escaped newlines', () => {
    const certificateData = '-----BEGIN CERTIFICATE-----\\nMIIDrTCCApWgAwIBAgIENFgbaDANBgkqhkiG9w0BAQsFADCBgDELMAkGA1UEBhMC\\n-----END CERTIFICATE-----';
    const expected = '-----BEGIN CERTIFICATE-----\nMIIDrTCCApWgAwIBAgIENFgbaDANBgkqhkiG9w0BAQsFADCBgDELMAkGA1UEBhMC\n-----END CERTIFICATE-----';

    expect(normalizeCertificateNewlines(certificateData)).toBe(expected);
  });

  it('trims whitespace from the result', () => {
    const input = '  line1\\nline2\\nline3  ';
    const expected = 'line1\nline2\nline3';

    expect(normalizeCertificateNewlines(input)).toBe(expected);
  });

  it('returns null for empty string', () => {
    expect(normalizeCertificateNewlines('')).toBeNull();
  });

  it('returns null for null input', () => {
    expect(normalizeCertificateNewlines(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(normalizeCertificateNewlines(undefined)).toBeNull();
  });

  it('returns null for whitespace-only string', () => {
    expect(normalizeCertificateNewlines('   ')).toBeNull();
  });

  it('returns null for whitespace-only string with escaped newlines', () => {
    expect(normalizeCertificateNewlines('\\n\\n\\n')).toBeNull();
  });

  it('handles mixed real and escaped newlines', () => {
    const input = 'line1\nline2\\nline3';
    const expected = 'line1\nline2\nline3';

    expect(normalizeCertificateNewlines(input)).toBe(expected);
  });

  it('preserves already normalized certificate data', () => {
    const certificateData = '-----BEGIN CERTIFICATE-----\nMIIDrTCCApWgAwIBAgIENFgbaDANBgkqhkiG9w0BAQsFADCBgDELMAkGA1UEBhMC\n-----END CERTIFICATE-----';

    expect(normalizeCertificateNewlines(certificateData)).toBe(certificateData);
  });

  describe('usage patterns with explicit null handling', () => {
    it('handles required field pattern: normalizeCertificateNewlines(data) || ""', () => {
      // Required fields should use || '' to ensure non-null string
      expect(normalizeCertificateNewlines('cert\\ndata') || '').toBe('cert\ndata');
      expect(normalizeCertificateNewlines('') || '').toBe('');
      expect(normalizeCertificateNewlines('   ') || '').toBe('');
    });

    it('handles optional field pattern: normalizeCertificateNewlines(data)', () => {
      // Optional fields can be null
      expect(normalizeCertificateNewlines('key\\ndata')).toBe('key\ndata');
      expect(normalizeCertificateNewlines('')).toBeNull();
      expect(normalizeCertificateNewlines('   ')).toBeNull();
    });

    it('handles undefined fallback pattern: normalizeCertificateNewlines(data) || undefined', () => {
      // Some optional fields use undefined instead of null
      expect(normalizeCertificateNewlines('key\\ndata') || undefined).toBe('key\ndata');
      expect(normalizeCertificateNewlines('') || undefined).toBeUndefined();
    });
  });
});
