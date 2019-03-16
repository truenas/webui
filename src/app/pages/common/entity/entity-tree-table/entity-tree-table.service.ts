import { Injectable } from '@angular/core';
import { TreeNode } from 'primeng/api';

import { WebSocketService } from '../../../../services';

@Injectable()
export class EntityTreeTableService {
    constructor(private ws: WebSocketService) {}

    buildTree(data) {
        const tree: Array<TreeNode> = [];
        for (let i = 0; i < data.length; i++) {
            const node = this.getNode(data[i]);
			tree.push(node);
		}
        return tree;
    }

    getNode(item) {
        const nodeData = {};
        for (const prop in item) {
            nodeData[prop] = item[prop];
        }

        const nodeChildren = [];
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