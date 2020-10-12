import { Injectable } from '@angular/core';
//import { TreeNode } from 'primeng/api';

import { WebSocketService } from '../../../../services';

export interface TreeNode {
  children?: TreeNode[];
  data?: any;
  expanded?: boolean;
  indexPath?: number[];
}

@Injectable()
export class EntityTreeTableService {
  constructor(private ws: WebSocketService) {}

  buildTree(data) {
    let tree: Array<TreeNode> = [];
    for (let i = 0; i < data.length; i++) {
      const node = this.getNode(data[i]);
      tree.push(node);
    }
    return tree;
  }

  buildTable(data, expandAll: boolean = false){
    console.log("BUILD TABLE METHOD...");
    // Converts a Tree structure to a flat list
    let flatList: TreeNode[] = [];

    // Walk to get the children
    const rootIndexPath = [0];
    this.walk(data, flatList, null, expandAll);

    console.log(flatList);
    return flatList;
  }

  walk(tree: TreeNode[], rows: TreeNode[], parentIndexPath?: number[], expandAll?: boolean ){
      console.log(tree);
    tree.forEach((node, nodeIndex) => {
      if(expandAll){
        node.expanded = true;
      }

      if(!node.expanded || node.expanded.toString() !== 'true'){ 
        node.expanded = false;
      } 

      node.indexPath = !parentIndexPath && rows.length == 0 ? [nodeIndex] : parentIndexPath.concat([nodeIndex]);
      rows.push(node);

      if(node.children.length > 0 && node.expanded && node.expanded.toString() == 'true'){ 
        // ...but the Children!
        this.walk(node.children, rows, node.indexPath,  expandAll);
      }

    });
  }

  editNode(prop: string, value: any, indexPath: number[], treeData: TreeNode[]){
    
    console.log("Setting expanded to " + value);
    // Clone the data
    let clone = Object.assign([], treeData);

    // Find and Edit the node in cloned data
    let node = clone[0];
    indexPath.forEach((step, index) => {
      if(index > 0){
        node = node.children[step];
      }
    });

    node[prop] = value;
    console.log(node);
    console.log(indexPath);

    // Build new flat list
    return clone;
  }

  getNode(item) {
    let nodeData = {};
    for (const prop in item) {
      nodeData[prop] = item[prop];
    }

    const nodeChildren = [];
    for (const child in item.children) {
      nodeChildren.push(this.getNode(item.children[child]));
    }

    let node: TreeNode = {};
    node.data = nodeData;
    node.expanded = true;
    node.children = nodeChildren;
    return node;
  }
}
