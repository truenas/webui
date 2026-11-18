import { isVdevGroup, VDevNestedDataNode } from 'app/interfaces/device-nested-data-node.interface';
import { isTopologyDisk } from 'app/interfaces/storage.interface';

/**
 * Whether the VDEVs search finds a device: a disk by its device name, a vdev by its name. A group never matches
 * by itself.
 */
export function deviceMatchesSearch(node: VDevNestedDataNode, query: string): boolean {
  if (isVdevGroup(node)) {
    return false;
  }

  const name = isTopologyDisk(node) ? node.disk : node.name;
  return Boolean(name?.toLowerCase().includes(query.toLowerCase()));
}
