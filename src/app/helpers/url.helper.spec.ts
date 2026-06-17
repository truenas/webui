import { isSigninUrl, stripQueryAndFragment } from './url.helper';

describe('stripQueryAndFragment', () => {
  it('returns the path unchanged when there is no query or fragment', () => {
    expect(stripQueryAndFragment('/credentials/users/api-keys')).toBe('/credentials/users/api-keys');
  });

  it('strips a query string', () => {
    expect(stripQueryAndFragment('/credentials/users/api-keys?userName=root')).toBe('/credentials/users/api-keys');
  });

  it('strips a fragment', () => {
    expect(stripQueryAndFragment('/credentials/users/api-keys#section')).toBe('/credentials/users/api-keys');
  });

  it('strips both a query string and a fragment', () => {
    expect(stripQueryAndFragment('/credentials/users/api-keys?userName=root#section'))
      .toBe('/credentials/users/api-keys');
  });
});

describe('isSigninUrl', () => {
  it('returns true for signin page', () => {
    expect(isSigninUrl('/signin')).toBe(true);
  });

  it('returns true for signin page with query params', () => {
    expect(isSigninUrl('/signin?username=root')).toBe(true);
  });

  it('returns true for signin sub-routes', () => {
    expect(isSigninUrl('/signin/foo')).toBe(true);
  });

  it('returns true for signin with trailing slash', () => {
    expect(isSigninUrl('/signin/')).toBe(true);
  });

  it('returns false for dashboard', () => {
    expect(isSigninUrl('/dashboard')).toBe(false);
  });

  it('returns false for other routes', () => {
    expect(isSigninUrl('/credentials/users')).toBe(false);
  });

  it('returns false for routes containing signin but not starting with it', () => {
    expect(isSigninUrl('/app/signin')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isSigninUrl('')).toBe(false);
  });

  it('returns false for root path', () => {
    expect(isSigninUrl('/')).toBe(false);
  });

  it('returns false for signin-like routes that are not signin', () => {
    expect(isSigninUrl('/signin-admin')).toBe(false);
    expect(isSigninUrl('/signin123')).toBe(false);
    expect(isSigninUrl('/signinpage')).toBe(false);
  });
});
