export function getCleanLink(link: string): string {
  let cleanSrc = link
    .replace('http://', '')
    .replace('https://', '')
    .replace('www.', '');
  while (cleanSrc.endsWith('/')) {
    cleanSrc = cleanSrc.substring(0, cleanSrc.length - 1);
  }
  return cleanSrc;
}
