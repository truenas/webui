export function flattenTreeWithFilter<T extends { children?: T[] }>(
  items: T[],
  filterFunction: (item: T) => boolean,
  foundItems: T[] = [],
): T[] {
  if (!items?.length) {
    return undefined;
  }

  for (const item of items) {
    if (filterFunction(item)) {
      foundItems.push(item);
    } else {
      flattenTreeWithFilter(item.children, filterFunction, foundItems);
    }
  }

  return foundItems;
}
