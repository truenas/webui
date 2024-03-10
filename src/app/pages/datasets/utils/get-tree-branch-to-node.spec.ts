import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { getTreeBranchToNode } from 'app/pages/datasets/utils/get-tree-branch-to-node.utils';

describe('getTreeBranchToNode', () => {
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
  ] as DatasetDetails[];

  it('returns an array of parent and children datasets from the tree by the predicate', () => {
    const result = getTreeBranchToNode(tree, (dataset) => dataset.id === 'root/parent/child');

    expect(result).toHaveLength(3);
    expect(result?.[0].id).toBe('root');
    expect(result?.[1].id).toBe('root/parent');
    expect(result?.[2].id).toBe('root/parent/child');
  });

  it('returns null when none of the nodes matches predicate', () => {
    const result = getTreeBranchToNode(tree, (dataset) => dataset.id === 'non/existent');

    expect(result).toBeNull();
  });
});
