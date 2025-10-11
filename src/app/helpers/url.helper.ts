/**
 * Checks if a URL path is the signin page or a signin-related route.
 * @param url The URL path to check (can include query params)
 * @returns true if the URL is a signin page, false otherwise
 */
export function isSigninUrl(url: string): boolean {
  return url.startsWith('/signin');
}
