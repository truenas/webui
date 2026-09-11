import { verifyTotp } from 'app/helpers/totp.helper';

// RFC 6238 / RFC 4226 reference seed: the ASCII string '12345678901234567890'.
const referenceSecret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

describe('verifyTotp', () => {
  // Every 8-digit vector from RFC 6238, Appendix B (SHA-1 column).
  it.each([
    [59, '94287082'],
    [1111111109, '07081804'],
    [1111111111, '14050471'],
    [1234567890, '89005924'],
    [2000000000, '69279037'],
    [20000000000, '65353130'],
  ])('accepts the RFC 6238 code for time %i', (seconds, code) => {
    expect(verifyTotp(referenceSecret, code, { digits: 8, window: 0, now: seconds * 1000 })).toBe(true);
  });

  it('accepts a 6-digit code for the current time step', () => {
    // RFC 4226 test value for counter 1, which is the time step covering 30-59s.
    expect(verifyTotp(referenceSecret, '287082', { window: 0, now: 59_000 })).toBe(true);
  });

  it('accepts a code from an adjacent time step to absorb clock skew', () => {
    // Same code, checked a step early and a step late.
    expect(verifyTotp(referenceSecret, '287082', { now: 29_000 })).toBe(true);
    expect(verifyTotp(referenceSecret, '287082', { now: 89_000 })).toBe(true);
    expect(verifyTotp(referenceSecret, '287082', { window: 0, now: 89_000 })).toBe(false);
  });

  it('reads a secret however an authenticator app spells it', () => {
    // Padding, spacing and casing all appear in provisioning URIs and in secrets people
    // copy by hand; all three must decode to the same key.
    expect(verifyTotp('gezd gnbv gy3t qojq gezd gnbv gy3t qojq==', '287082', { window: 0, now: 59_000 })).toBe(true);
  });

  it('tolerates spacing in the code the user typed', () => {
    expect(verifyTotp(referenceSecret, ' 287 082 ', { window: 0, now: 59_000 })).toBe(true);
  });

  it('rejects a code that does not belong to the secret', () => {
    expect(verifyTotp(referenceSecret, '000000', { now: 59_000 })).toBe(false);
  });

  it('rejects codes of the wrong shape', () => {
    expect(verifyTotp(referenceSecret, '28708', { now: 59_000 })).toBe(false);
    expect(verifyTotp(referenceSecret, 'abcdef', { now: 59_000 })).toBe(false);
    expect(verifyTotp(referenceSecret, '', { now: 59_000 })).toBe(false);
  });

  it('rejects everything when the secret is unreadable', () => {
    expect(verifyTotp('not-base32!', '287082', { now: 59_000 })).toBe(false);
  });
});
