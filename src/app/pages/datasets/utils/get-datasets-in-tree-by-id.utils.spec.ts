import { Dataset } from 'app/interfaces/dataset.interface';
import { getDatasetAndParentsById } from 'app/pages/datasets/utils/get-datasets-in-tree-by-id.utils';

describe('getDatasetAndParentsById', () => {
  const tree = [
    {
      id: 'root',
      children: [
        {
          id: 'root/parent',
          children: [
            { id: 'root/parent/child' },
          ],
        },
        {
          id: 'root/parent2',
        },
      ],
    },
    {
      id: 'root2',
    },
  ] as Dataset[];

  it('returns an array of parent and children datasets from the tree for the given id', () => {
    const result = getDatasetAndParentsById(tree, 'root/parent/child');

    expect(result.length).toBe(3);
    expect(result[0].id).toBe('root');
    expect(result[1].id).toBe('root/parent');
    expect(result[2].id).toBe('root/parent/child');
  });

  it('returns null when path cannot be fully resolved', () => {
    const result = getDatasetAndParentsById(tree, 'non/existent');

    expect(result).toBeNull();
  });
});
