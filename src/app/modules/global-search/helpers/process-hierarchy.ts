export function processHierarchy(hierarchy: string[] = [], searchTerm = ''): string {
  const escapeRegExp = (term: string): string => term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const searchWords = searchTerm.split(' ').map(escapeRegExp).filter((word) => word);

  const regex = new RegExp(`(${searchWords.join('|')})`, 'gi');

  const processedItems = hierarchy.map((item) => {
    return item.split(regex).map((segment) => {
      if (!segment) {
        return '';
      }

      if (segment.match(regex) && item === hierarchy[hierarchy.length - 1]) {
        return `<span class="highlight">${segment}</span>`;
      }

      return `<span class="dimmed-text">${segment}</span>`;
    }).join('');
  });

  return processedItems.join(' → ');
}
