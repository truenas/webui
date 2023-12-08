import { findInTree } from 'app/modules/ix-tree/utils/find-in-tree.utils';

interface TestItem {
  id: number;
  name: string;
  children?: TestItem[];
}

describe('findInTree', () => {
  it('should find an item at the root level', () => {
    const items: TestItem[] = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' },
    ];

    const result = findInTree(items, (item) => item.id === 2);
    expect(result).toEqual({ id: 2, name: 'Item 2' });
  });

  it('should return undefined if the item is not found', () => {
    const items: TestItem[] = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
    ];

    const result = findInTree(items, (item) => item.id === 3);
    expect(result).toBeUndefined();
  });

  it('should find an item in a nested structure', () => {
    const items: TestItem[] = [
      {
        id: 1,
        name: 'Item 1',
        children: [
          {
            id: 2,
            name: 'Item 2',
            children: [
              { id: 3, name: 'Item 3' },
            ],
          },
        ],
      },
    ];

    const result = findInTree(items, (item) => item.id === 3);
    expect(result).toEqual({ id: 3, name: 'Item 3' });
  });

  it('should handle empty arrays', () => {
    const items: TestItem[] = [];

    const result = findInTree(items, (item) => item.id === 1);
    expect(result).toBeUndefined();
  });

  it('should handle arrays with undefined children', () => {
    const items: TestItem[] = [
      { id: 1, name: 'Item 1', children: undefined },
    ];

    const result = findInTree(items, (item) => item.id === 1);
    expect(result).toEqual({ id: 1, name: 'Item 1', children: undefined });
  });
});
