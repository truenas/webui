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
