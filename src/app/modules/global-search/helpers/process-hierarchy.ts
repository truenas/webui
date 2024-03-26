function processSearchDocsHierarchyItem(hierarchyItem: string): string {
  const regex = /(.*«)(.*?)(».*)/;
  const match = hierarchyItem.match(regex);

  if (match) {
    const beforeQuote = match[1];
    const quotedText = match[2];
    const afterQuote = match[3];

    return `<span class="dimmed-text">${beforeQuote}</span><span class="highlight">${quotedText}</span><span class="dimmed-text">${afterQuote}</span>`;
  }

  return `<span class="dimmed-text">${hierarchyItem}</span>`;
}

export function processHierarchy(hierarchy: string[] = [], searchTerm = ''): string {
  if (hierarchy.length === 1 && hierarchy[0].includes('«') && hierarchy[0].includes('»')) {
    return processSearchDocsHierarchyItem(hierarchy[0]);
  }

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
