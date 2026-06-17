/**
 * Strips the query string and fragment from a URL, leaving only the path.
 * @param {string} url The URL to clean (e.g. `/credentials/users/api-keys?userName=root#x`)
 * @returns {string} The path portion only (e.g. `/credentials/users/api-keys`)
 */
export function stripQueryAndFragment(url: string): string {
  return url.split('?')[0].split('#')[0];
}

/**
 * Checks if a URL path is the signin page or a signin-related route.
 * @param {string} url The URL path to check (can include query params)
 * @returns {boolean} true if the URL is a signin page, false otherwise
 */
export function isSigninUrl(url: string): boolean {
  if (!url) {
    return false;
  }

  // Remove query params to check the path only
  const path = url.split('?')[0];

  // Match exact /signin or /signin/ followed by sub-routes
  return path === '/signin' || path.startsWith('/signin/');
}
