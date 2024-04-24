function processSearchDocsHierarchyItem(hierarchyItem: string): string {
  const regex = /(.*«)(.*?)(».*)/;
  const match: RegExpMatchArray | null = hierarchyItem.match(regex);

  if (match) {
    const beforeQuote: string = match[1];
    const quotedText: string = match[2];
    const afterQuote: string = match[3];

    return `<span class="dimmed-text">${beforeQuote}</span><span class="highlight">${quotedText}</span><span class="dimmed-text">${afterQuote}</span>`;
  }

  return `<span class="dimmed-text">${hierarchyItem}</span>`;
}

export function processHierarchy(hierarchy: string[] = [], searchTerm = ''): string {
  if (searchTerm === null) {
    searchTerm = '';
  }

  if (hierarchy.length === 1 && hierarchy[0].includes('«') && hierarchy[0].includes('»')) {
    return processSearchDocsHierarchyItem(hierarchy[0]);
  }

  const escapeRegExp = (term: string): string => term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const searchWords: string[] = searchTerm?.split(' ').map(escapeRegExp).filter((word) => word !== '');

  const regex = new RegExp(`(${searchWords.join('|')})`, 'gi');

  const processedItems: string[] = hierarchy.map((item: string, index: number) => {
    // Highlight only the last item if no search term is provided
    if (searchTerm === '') {
      if (hierarchy.length >= 1 && index === hierarchy.length - 1) {
        return `<span class="highlight">${item}</span>`;
      }
      return `<span class="dimmed-text">${item}</span>`;
    }

    // When a search term is provided, match and highlight within the last item only
    if (hierarchy.length >= 1 && index === hierarchy.length - 1) {
      const lastItemSegments = item.split(regex).map((segment) => {
        return segment.match(regex) ? `<span class="highlight">${segment}</span>` : `<span class="dimmed-text">${segment}</span>`;
      });
      return lastItemSegments.join('');
    }
    // Dim other items without highlighting matches
    return `<span class="dimmed-text">${item}</span>`;
  });

  return processedItems.join(' → ');
}
