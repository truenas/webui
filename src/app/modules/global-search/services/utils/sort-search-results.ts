import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export function sortSearchResults(term: string, results: UiSearchableElement[]): UiSearchableElement[] {
  const normalizedTerm = term.toLowerCase();

  return results.sort((itemOne, itemTwo) => {
    const itemOneHierarchy = itemOne.hierarchy.map((hierarchyItem) => hierarchyItem.toLowerCase());
    const itemTwoHierarchy = itemTwo.hierarchy.map((hierarchyItem) => hierarchyItem.toLowerCase());
    const itemOneSynonyms = itemOne.synonyms.map((synonym) => synonym.toLowerCase());
    const itemTwoSynonyms = itemTwo.synonyms.map((synonym) => synonym.toLowerCase());

    // Check for exact matches in hierarchy or synonyms
    const itemExactMatchOne = itemOneHierarchy.includes(normalizedTerm) || itemOneSynonyms.includes(normalizedTerm)
      ? 1
      : 0;
    const itemExactMatchTwo = itemTwoHierarchy.includes(normalizedTerm) || itemTwoSynonyms.includes(normalizedTerm)
      ? 1
      : 0;
    if (itemExactMatchOne !== itemExactMatchTwo) {
      return itemExactMatchTwo - itemExactMatchOne;
    }

    // Check for first letter matches in hierarchy
    const itemFirstLetterHierarchyMatchOne = itemOneHierarchy.some(
      (hierarchyItem) => hierarchyItem.startsWith(normalizedTerm),
    )
      ? 1
      : 0;
    const itemFirstLetterHierarchyMatchTwo = itemTwoHierarchy.some(
      (hierarchyItem) => hierarchyItem.startsWith(normalizedTerm),
    )
      ? 1
      : 0;
    if (itemFirstLetterHierarchyMatchOne !== itemFirstLetterHierarchyMatchTwo) {
      return itemFirstLetterHierarchyMatchTwo - itemFirstLetterHierarchyMatchOne;
    }

    // Check for first letter matches in synonyms
    const itemFirstLetterSynonymMatchOne = itemOneSynonyms.some((synonym) => synonym.startsWith(normalizedTerm))
      ? 1
      : 0;
    const itemFirstLetterSynonymMatchTwo = itemTwoSynonyms.some((synonym) => synonym.startsWith(normalizedTerm))
      ? 1
      : 0;
    if (itemFirstLetterSynonymMatchOne !== itemFirstLetterSynonymMatchTwo) {
      return itemFirstLetterSynonymMatchTwo - itemFirstLetterSynonymMatchOne;
    }

    // Check for root pages (single hierarchy level)
    const itemIsRootPageOne = itemOne.hierarchy.length === 1 ? 1 : 0;
    const itemIsRootPageTwo = itemTwo.hierarchy.length === 1 ? 1 : 0;
    if (itemIsRootPageOne !== itemIsRootPageTwo) {
      return itemIsRootPageTwo - itemIsRootPageOne;
    }

    // Check for partial matches in hierarchy
    const itemPartialHierarchyMatchOne = itemOneHierarchy.some(
      (hierarchyItem) => hierarchyItem.includes(normalizedTerm),
    )
      ? 1
      : 0;
    const itemPartialHierarchyMatchTwo = itemTwoHierarchy.some(
      (hierarchyItem) => hierarchyItem.includes(normalizedTerm),
    )
      ? 1
      : 0;
    if (itemPartialHierarchyMatchOne !== itemPartialHierarchyMatchTwo) {
      return itemPartialHierarchyMatchTwo - itemPartialHierarchyMatchOne;
    }

    // Check for partial matches in synonyms
    const itemPartialSynonymMatchOne = itemOneSynonyms.some((synonym) => synonym.includes(normalizedTerm)) ? 1 : 0;
    const itemPartialSynonymMatchTwo = itemTwoSynonyms.some((synonym) => synonym.includes(normalizedTerm)) ? 1 : 0;
    if (itemPartialSynonymMatchOne !== itemPartialSynonymMatchTwo) {
      return itemPartialSynonymMatchTwo - itemPartialSynonymMatchOne;
    }

    // If no matches or matches are equal, compare hierarchy lengths
    return itemOne.hierarchy.length - itemTwo.hierarchy.length;
  });
}
