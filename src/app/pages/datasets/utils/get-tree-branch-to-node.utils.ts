/**
 * Given an array of something nested will return an object matching predicate
 * and all the parents.
 * E.g. given datasets and predicate matching 'root/parent/child',
 * returns an array of datasets: [root, parent, child].
 *
 * Returns null if element is not gound.
 */
export function getTreeBranchToNode<T extends { children?: T[] }>(
  items: T[],
  predicate: (item: T) => boolean,
): T[] | null {
  if (!items?.length) {
    return null;
  }

  for (const item of items) {
    if (predicate(item)) {
      return [item];
    }

    if (item.children) {
      const children = getTreeBranchToNode(item.children, predicate);
      if (children) {
        return [item, ...children];
      }
    }
  }

  return null;
}
