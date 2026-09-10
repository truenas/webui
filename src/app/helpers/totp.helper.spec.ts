import { decodeBase32, verifyTotp } from 'app/helpers/totp.helper';

// RFC 6238 / RFC 4226 reference seed: the ASCII string '12345678901234567890'.
const referenceSecret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

describe('decodeBase32', () => {
  it('decodes a base32 string into its bytes', () => {
    expect(Array.from(decodeBase32('MZXW6YTB') || [])).toEqual([...'fooba'].map((char) => char.charCodeAt(0)));
  });

  it('ignores padding, spacing and casing that authenticator apps add', () => {
    expect(decodeBase32('mzxw 6ytb==')).toEqual(decodeBase32('MZXW6YTB'));
  });

  it('returns null for text that is not base32', () => {
    expect(decodeBase32('not-base32!')).toBeNull();
    expect(decodeBase32('   ')).toBeNull();
  });
});

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
