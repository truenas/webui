import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

/**
 * Ranks of an element against the term, most significant first; each is 1 when it holds.
 * An element's own terms are the last item of its hierarchy and its synonyms. A match there ranks above
 * one on an ancestor, so a page whose synonym is the term is not buried under every child of a section
 * that happens to share the term's name.
 */
function getRanks(term: string, element: UiSearchableElement): number[] {
  const hierarchy = element.hierarchy?.map((hierarchyItem) => hierarchyItem.toLowerCase()) || [];
  const synonyms = element.synonyms?.map((synonym) => synonym.toLowerCase()) || [];
  const ownName = hierarchy[hierarchy.length - 1] ?? '';

  return [
    // Exact match on own terms
    ownName === term || synonyms.includes(term),
    // Exact match anywhere in hierarchy
    hierarchy.includes(term),
    // First letter match on own name
    ownName.startsWith(term),
    // First letter match in synonyms
    synonyms.some((synonym) => synonym.startsWith(term)),
    // First letter match anywhere in hierarchy
    hierarchy.some((hierarchyItem) => hierarchyItem.startsWith(term)),
    // Root pages (single hierarchy level)
    element.hierarchy?.length === 1,
    // Partial match in hierarchy
    hierarchy.some((hierarchyItem) => hierarchyItem.includes(term)),
    // Partial match in synonyms
    synonyms.some((synonym) => synonym.includes(term)),
  ].map(Number);
}

export function sortSearchResults(term: string, results: UiSearchableElement[]): UiSearchableElement[] {
  const normalizedTerm = term.toLowerCase();

  return results.sort((itemOne, itemTwo) => {
    const ranksOne = getRanks(normalizedTerm, itemOne);
    const ranksTwo = getRanks(normalizedTerm, itemTwo);
    const differingRank = ranksOne.findIndex((rank, index) => rank !== ranksTwo[index]);
    if (differingRank !== -1) {
      return ranksTwo[differingRank] - ranksOne[differingRank];
    }

    // If no matches or matches are equal, compare hierarchy lengths
    return Number(itemOne.hierarchy?.length) - Number(itemTwo.hierarchy?.length);
  });
}
