import { isVdevGroup, VDevNestedDataNode } from 'app/interfaces/device-nested-data-node.interface';
import { getTreeBranchToNode } from 'app/pages/datasets/utils/get-tree-branch-to-node.utils';

/**
 * Finds what to select instead of a device that is gone from `nodes`, given `branch`, the path to it before it
 * went, starting with its group.
 *
 * That is the device that took its place, found as the one new child of its closest remaining parent: the disk a
 * finished replacement or spare collapsed into, or the disk left when a mirror lost its other disk. Without one,
 * that parent itself, unless it is a group.
 */
export function findReplacementNode(
  nodes: VDevNestedDataNode[],
  branch: VDevNestedDataNode[],
): VDevNestedDataNode | null {
  for (let index = branch.length - 2; index >= 0; index--) {
    const parentBefore = branch[index];
    const parent = getTreeBranchToNode(nodes, (node) => node.guid === parentBefore.guid)?.at(-1);
    if (!parent) {
      continue;
    }

    const guidsBefore = new Set((parentBefore.children || []).map((child) => child.guid));
    const newChildren = (parent.children || []).filter((child) => !guidsBefore.has(child.guid));
    if (newChildren.length === 1) {
      return newChildren[0];
    }

    return isVdevGroup(parent) ? null : parent;
  }

  return null;
}
