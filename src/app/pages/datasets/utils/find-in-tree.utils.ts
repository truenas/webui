export function findInTree<T extends { children?: T[] }>(
  datasets: T[],
  predicate: (node: T) => boolean,
): T {
  if (!datasets?.length) {
    return;
  }

  for (const dataset of datasets) {
    if (predicate(dataset)) {
      return dataset;
    }

    const child = findInTree(dataset.children, predicate);
    if (child) {
      return child;
    }
  }
}
