import { Injectable } from '@angular/core';

export interface TreeNode {
  children?: TreeNode[];
  data?: any;
  expanded?: boolean;
  indexPath?: number[];
}

@Injectable()
export class EntityTreeTableService {
  // Do we still need this?
  buildTree(data: unknown[]): TreeNode[] {
    const tree: TreeNode[] = [];
    data.forEach((item) => {
      const node = this.getNode(item);
      tree.push(node);
    });
    return tree;
  }

  buildTable(data: TreeNode[], expandAll = false): TreeNode[] {
    // Converts a Tree structure to a flat list
    const flatList: TreeNode[] = [];

    // Walk to get the children
    this.walk(data, flatList, null, expandAll);

    return flatList;
  }

  walk(tree: TreeNode[], rows: TreeNode[], parentIndexPath?: number[], expandAll?: boolean): void {
    tree.forEach((node, nodeIndex) => {
      if (expandAll && node.children.length > 0) {
        node.expanded = true;
      }

      if (node.expanded && node.expanded.toString() !== 'true') {
        node.expanded = false;
      }

      node.indexPath = !parentIndexPath && rows.length === 0 ? [nodeIndex] : parentIndexPath.concat([nodeIndex]);
      rows.push(node);

      if (node.children.length > 0 && node.expanded && node.expanded.toString() === 'true') {
        // ...but the Children!
        this.walk(node.children, rows, node.indexPath, expandAll);
      }
    });
  }

  findNode(indexPath: number[], treeData: TreeNode[]): TreeNode {
    let currentNode: TreeNode;
    indexPath.forEach((tier, index) => {
      currentNode = index === 0 ? treeData[0] : currentNode.children[tier];
    });

    return currentNode;
  }

  findParents(indexPath: number[], data: TreeNode[]): { [id: string]: boolean } {
    const output: { [id: string]: boolean } = {};
    const path = Object.assign([], indexPath);

    for (let i = indexPath.length - 1; i >= 0; i--) {
      const node = this.findNode(path, data);
      output[node.data.id] = true;
      path.pop();
    }

    return output;
  }

  editNode(prop: keyof TreeNode, value: unknown, indexPath: number[], treeData: TreeNode[]): TreeNode[] {
    const node = this.findNode(indexPath, treeData);

    // Clone the data
    const clone = Object.assign([], treeData);

    node[prop] = value;

    return clone;
  }

  filteredTable(key: string, value: string, data: TreeNode[], preserveExpansion = false): TreeNode[] {
    // let flattened = this.buildTable(...args); // ES6 way not working?
    const flattened = preserveExpansion ? this.buildTable(data) : this.buildTable(data, true);

    // Parents we need to keep
    let preserve: { [id: string]: boolean } = {};

    for (let index = flattened.length - 1; index >= 0; index--) {
      const row = flattened[index];
      if (row.data[key].includes(value)) {
        // Log ancestors so we know which ones to keep
        const parents = this.findParents(row.indexPath, data);
        preserve = Object.assign(preserve, parents);
      } else if (row.children.length === 0 || !preserve[row.data.id]) {
        flattened.splice(index, 1);
      }
    }

    return flattened;
  }

  // Do we still need this?
  getNode(item: Record<string, any>): TreeNode {
    const nodeData: Record<string, unknown> = {};
    for (const prop in item) {
      nodeData[prop] = item[prop];
    }

    const nodeChildren: unknown[] = [];
    for (const child in item.children) {
      nodeChildren.push(this.getNode(item.children[child]));
    }

    const node: TreeNode = {};
    node.data = nodeData;
    node.expanded = true;
    node.children = nodeChildren;
    return node;
  }
}
