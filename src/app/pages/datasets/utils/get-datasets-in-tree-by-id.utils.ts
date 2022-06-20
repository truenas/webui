import { Dataset } from 'app/interfaces/dataset.interface';

/**
 * Given id 'root/parent/child', returns an array of datasets: [root, parent, child].
 * Will return null if path cannot be fully resolved.
 */
export function getDatasetAndParentsById(datasets: Dataset[], id: string): Dataset[] | null {
  const segments = id.split('/');
  let haystack = datasets;
  let needle: string;
  const result: Dataset[] = [];
  for (const segment of segments) {
    needle = needle ? [needle, segment].join('/') : segment;
    const datasetOnThisLevel = haystack.find((dataset) => dataset.id === needle);
    if (!datasetOnThisLevel) {
      return null;
    }

    result.push(datasetOnThisLevel);
    haystack = datasetOnThisLevel.children;
  }

  return result;
}
