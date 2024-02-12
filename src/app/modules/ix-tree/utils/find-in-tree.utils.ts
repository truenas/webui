export function findInTree<T extends { children?: T[] }>(
  items: T[],
  predicate: (item: T) => boolean,
): T | undefined {
  if (!items?.length) {
    return undefined;
  }

  for (const item of items) {
    if (predicate(item)) {
      return item;
    }

    const child = findInTree(item.children, predicate);
    if (child) {
      return child;
    }
  }

  return undefined;
}
