import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { datasetNameSortComparer } from 'app/pages/datasets/utils/dataset.utils';

describe('datasetNameSortComparer', () => {
  it('sorts dataset paths in natural order maintaining parent-child relations', () => {
    const filepaths = [
      { name: '/parent' },
      { name: '/parent30' },
      { name: '/parent-2' },
      { name: '/parent3' },
      { name: '/pårent/child' },
      { name: '/parent/child' },
      { name: '/parent/child/grandchild' },
      { name: '/parent4' },
      { name: '/pårent' },
    ] as DatasetDetails[];

    const sortedFilepaths = filepaths.toSorted(datasetNameSortComparer);

    expect(sortedFilepaths).toEqual([
      { name: '/parent' },
      { name: '/parent/child' },
      { name: '/parent/child/grandchild' },
      { name: '/pårent' },
      { name: '/pårent/child' },
      { name: '/parent-2' },
      { name: '/parent3' },
      { name: '/parent4' },
      { name: '/parent30' },
    ]);
  });
});
