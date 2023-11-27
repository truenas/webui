export function findInTree<T extends { children?: T[] }>(
  items: T[],
  predicate: (item: T) => boolean,
): T {
  if (!items?.length) {
    return undefined;
  }

  // eslint-disable-next-line no-unreachable-loop
  for (const item of items) {
    if (predicate(item)) {
      return item;
    }

    const child = findInTree(item.children, predicate);
    if (child) {
      return child;
    }

    return undefined;
  }

  return undefined;
}
