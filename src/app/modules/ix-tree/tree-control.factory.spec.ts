import { SelectionModel } from '@angular/cdk/collections';
import {
  createFlatTreeControl,
  createNestedTreeControl,
} from 'app/modules/ix-tree/tree-control.factory';
import { TreeExpansion } from 'app/modules/ix-tree/tree-expansion.interface';

interface TestNode {
  id: string;
  name: string;
  level: number;
  expandable: boolean;
  children?: TestNode[];
}

describe('Tree Control Factory', () => {
  describe('createFlatTreeControl', () => {
    let treeControl: TreeExpansion<TestNode, string>;
    const getLevel = (node: TestNode): number => node.level;
    const isExpandable = (node: TestNode): boolean => node.expandable;

    beforeEach(() => {
      treeControl = createFlatTreeControl<TestNode, string>(
        getLevel,
        isExpandable,
        { trackBy: (node) => node.id },
      );
    });

    it('should return an object that implements TreeExpansion interface', () => {
      expect(treeControl).toBeDefined();
      expect('dataNodes' in treeControl).toBe(true);
      expect(treeControl.expansionModel).toBeDefined();
      expect(typeof treeControl.isExpanded).toBe('function');
      expect(typeof treeControl.toggle).toBe('function');
      expect(typeof treeControl.expand).toBe('function');
      expect(typeof treeControl.collapse).toBe('function');
      expect(typeof treeControl.expandAll).toBe('function');
      expect(typeof treeControl.collapseAll).toBe('function');
      expect(typeof treeControl.toggleDescendants).toBe('function');
      expect(typeof treeControl.expandDescendants).toBe('function');
      expect(typeof treeControl.collapseDescendants).toBe('function');
      expect(typeof treeControl.getDescendants).toBe('function');
    });

    it('should have expansion model as SelectionModel', () => {
      expect(treeControl.expansionModel).toBeInstanceOf(SelectionModel);
    });

    it('should have getLevel accessor function', () => {
      expect(treeControl.getLevel).toBe(getLevel);
    });

    it('should have isExpandable accessor function', () => {
      expect(treeControl.isExpandable).toBe(isExpandable);
    });

    it('should allow setting dataNodes', () => {
      const nodes: TestNode[] = [
        {
          id: '1', name: 'Node 1', level: 0, expandable: true,
        },
      ];
      treeControl.dataNodes = nodes;
      expect(treeControl.dataNodes).toEqual(nodes);
    });

    it('should track expansion state correctly', () => {
      const node: TestNode = {
        id: '1', name: 'Node 1', level: 0, expandable: true,
      };
      treeControl.dataNodes = [node];

      expect(treeControl.isExpanded(node)).toBe(false);

      treeControl.expand(node);
      expect(treeControl.isExpanded(node)).toBe(true);

      treeControl.collapse(node);
      expect(treeControl.isExpanded(node)).toBe(false);
    });

    it('should toggle expansion state', () => {
      const node: TestNode = {
        id: '1', name: 'Node 1', level: 0, expandable: true,
      };
      treeControl.dataNodes = [node];

      treeControl.toggle(node);
      expect(treeControl.isExpanded(node)).toBe(true);

      treeControl.toggle(node);
      expect(treeControl.isExpanded(node)).toBe(false);
    });

    it('should expand all nodes', () => {
      const nodes: TestNode[] = [
        {
          id: '1', name: 'Node 1', level: 0, expandable: true,
        },
        {
          id: '2', name: 'Node 2', level: 1, expandable: true,
        },
        {
          id: '3', name: 'Node 3', level: 2, expandable: false,
        },
      ];
      treeControl.dataNodes = nodes;

      treeControl.expandAll();

      expect(treeControl.isExpanded(nodes[0])).toBe(true);
      expect(treeControl.isExpanded(nodes[1])).toBe(true);
    });

    it('should collapse all nodes', () => {
      const nodes: TestNode[] = [
        {
          id: '1', name: 'Node 1', level: 0, expandable: true,
        },
        {
          id: '2', name: 'Node 2', level: 1, expandable: true,
        },
      ];
      treeControl.dataNodes = nodes;

      treeControl.expandAll();
      treeControl.collapseAll();

      expect(treeControl.isExpanded(nodes[0])).toBe(false);
      expect(treeControl.isExpanded(nodes[1])).toBe(false);
    });

    it('should get descendants of a node', () => {
      const nodes: TestNode[] = [
        {
          id: '1', name: 'Node 1', level: 0, expandable: true,
        },
        {
          id: '2', name: 'Node 2', level: 1, expandable: true,
        },
        {
          id: '3', name: 'Node 3', level: 2, expandable: false,
        },
        {
          id: '4', name: 'Node 4', level: 1, expandable: false,
        },
      ];
      treeControl.dataNodes = nodes;

      const descendants = treeControl.getDescendants(nodes[0]);

      expect(descendants).toContain(nodes[1]);
      expect(descendants).toContain(nodes[2]);
      expect(descendants).toContain(nodes[3]);
      expect(descendants).toHaveLength(3);
    });
  });

  describe('createNestedTreeControl', () => {
    let treeControl: TreeExpansion<TestNode, string>;
    const getChildren = (node: TestNode): TestNode[] | undefined => node.children;

    beforeEach(() => {
      treeControl = createNestedTreeControl<TestNode, string>(
        getChildren,
        {
          isExpandable: (node) => !!node.children?.length,
          trackBy: (node) => node.id,
        },
      );
    });

    it('should return an object that implements TreeExpansion interface', () => {
      expect(treeControl).toBeDefined();
      expect('dataNodes' in treeControl).toBe(true);
      expect(treeControl.expansionModel).toBeDefined();
      expect(typeof treeControl.isExpanded).toBe('function');
      expect(typeof treeControl.toggle).toBe('function');
      expect(typeof treeControl.expand).toBe('function');
      expect(typeof treeControl.collapse).toBe('function');
      expect(typeof treeControl.expandAll).toBe('function');
      expect(typeof treeControl.collapseAll).toBe('function');
      expect(typeof treeControl.toggleDescendants).toBe('function');
      expect(typeof treeControl.expandDescendants).toBe('function');
      expect(typeof treeControl.collapseDescendants).toBe('function');
      expect(typeof treeControl.getDescendants).toBe('function');
    });

    it('should have expansion model as SelectionModel', () => {
      expect(treeControl.expansionModel).toBeInstanceOf(SelectionModel);
    });

    it('should have getChildren accessor function', () => {
      expect(treeControl.getChildren).toBe(getChildren);
    });

    it('should allow setting dataNodes', () => {
      const nodes: TestNode[] = [
        {
          id: '1', name: 'Node 1', level: 0, expandable: true,
        },
      ];
      treeControl.dataNodes = nodes;
      expect(treeControl.dataNodes).toEqual(nodes);
    });

    it('should track expansion state correctly', () => {
      const child: TestNode = {
        id: '2', name: 'Child', level: 1, expandable: false,
      };
      const parent: TestNode = {
        id: '1',
        name: 'Parent',
        level: 0,
        expandable: true,
        children: [child],
      };
      treeControl.dataNodes = [parent];

      expect(treeControl.isExpanded(parent)).toBe(false);

      treeControl.expand(parent);
      expect(treeControl.isExpanded(parent)).toBe(true);

      treeControl.collapse(parent);
      expect(treeControl.isExpanded(parent)).toBe(false);
    });

    it('should toggle expansion state', () => {
      const child: TestNode = {
        id: '2', name: 'Child', level: 1, expandable: false,
      };
      const parent: TestNode = {
        id: '1',
        name: 'Parent',
        level: 0,
        expandable: true,
        children: [child],
      };
      treeControl.dataNodes = [parent];

      treeControl.toggle(parent);
      expect(treeControl.isExpanded(parent)).toBe(true);

      treeControl.toggle(parent);
      expect(treeControl.isExpanded(parent)).toBe(false);
    });

    it('should expand all nodes', () => {
      const grandchild: TestNode = {
        id: '3', name: 'Grandchild', level: 2, expandable: false,
      };
      const child: TestNode = {
        id: '2',
        name: 'Child',
        level: 1,
        expandable: true,
        children: [grandchild],
      };
      const parent: TestNode = {
        id: '1',
        name: 'Parent',
        level: 0,
        expandable: true,
        children: [child],
      };
      treeControl.dataNodes = [parent];

      treeControl.expandAll();

      expect(treeControl.isExpanded(parent)).toBe(true);
      expect(treeControl.isExpanded(child)).toBe(true);
    });

    it('should get descendants of a nested node', () => {
      const grandchild: TestNode = {
        id: '3', name: 'Grandchild', level: 2, expandable: false,
      };
      const child: TestNode = {
        id: '2',
        name: 'Child',
        level: 1,
        expandable: true,
        children: [grandchild],
      };
      const parent: TestNode = {
        id: '1',
        name: 'Parent',
        level: 0,
        expandable: true,
        children: [child],
      };
      treeControl.dataNodes = [parent];

      const descendants = treeControl.getDescendants(parent);

      expect(descendants).toContain(child);
      expect(descendants).toContain(grandchild);
      expect(descendants).toHaveLength(2);
    });

    it('should toggle descendants recursively', () => {
      const grandchild: TestNode = {
        id: '3', name: 'Grandchild', level: 2, expandable: false,
      };
      const child: TestNode = {
        id: '2',
        name: 'Child',
        level: 1,
        expandable: true,
        children: [grandchild],
      };
      const parent: TestNode = {
        id: '1',
        name: 'Parent',
        level: 0,
        expandable: true,
        children: [child],
      };
      treeControl.dataNodes = [parent];

      treeControl.toggleDescendants(parent);
      expect(treeControl.isExpanded(parent)).toBe(true);
      expect(treeControl.isExpanded(child)).toBe(true);

      treeControl.toggleDescendants(parent);
      expect(treeControl.isExpanded(parent)).toBe(false);
      expect(treeControl.isExpanded(child)).toBe(false);
    });
  });
});
