import { Dataset } from 'app/interfaces/dataset.interface';

export function findInTree(
  datasets: Dataset[],
  predicate: (dataset: Dataset) => boolean,
): Dataset {
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
