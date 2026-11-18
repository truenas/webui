import { VDevType } from 'app/enums/v-dev-type.enum';
import { VDevNestedDataNode } from 'app/interfaces/device-nested-data-node.interface';
import { findReplacementNode } from 'app/pages/storage/modules/vdevs/utils/find-replacement-node.utils';

describe('findReplacementNode', () => {
  const oldDisk = { guid: 'old', children: [] } as VDevNestedDataNode;
  const newDisk = { guid: 'new', children: [] } as VDevNestedDataNode;
  const otherDisk = { guid: 'other', children: [] } as VDevNestedDataNode;

  function dataGroup(children: VDevNestedDataNode[]): VDevNestedDataNode {
    return { group: 'Data VDEVs', guid: VDevType.Data, children } as VDevNestedDataNode;
  }

  function vdev(guid: string, children: VDevNestedDataNode[]): VDevNestedDataNode {
    return { guid, children } as VDevNestedDataNode;
  }

  it('returns the disk a finished replacement collapsed into', () => {
    const replacing = vdev('replacing-0', [oldDisk, newDisk]);
    const mirror = vdev('mirror-0', [replacing, otherDisk]);
    const branch = [dataGroup([mirror]), mirror, replacing, oldDisk];

    const nodes = [dataGroup([vdev('mirror-0', [newDisk, otherDisk])])];

    expect(findReplacementNode(nodes, branch)).toBe(newDisk);
  });

  it('returns the disk left in place of a mirror that lost its other disk', () => {
    const mirror = vdev('mirror-0', [oldDisk, otherDisk]);
    const branch = [dataGroup([mirror]), mirror, oldDisk];

    const nodes = [dataGroup([otherDisk])];

    expect(findReplacementNode(nodes, branch)).toBe(otherDisk);
  });

  it('returns the closest remaining parent vdev when nothing took the device\'s place', () => {
    const mirror = vdev('mirror-0', [oldDisk, otherDisk, newDisk]);
    const branch = [dataGroup([mirror]), mirror, oldDisk];

    const remainingMirror = vdev('mirror-0', [otherDisk, newDisk]);
    const nodes = [dataGroup([remainingMirror])];

    expect(findReplacementNode(nodes, branch)).toBe(remainingMirror);
  });

  it('returns null when a device was removed from its group and nothing took its place', () => {
    const removedVdev = vdev('mirror-1', [oldDisk]);
    const branch = [dataGroup([vdev('mirror-0', [otherDisk]), removedVdev]), removedVdev];

    const nodes = [dataGroup([vdev('mirror-0', [otherDisk])])];

    expect(findReplacementNode(nodes, branch)).toBeNull();
  });

  it('returns null when the device\'s whole group is gone', () => {
    const branch = [dataGroup([oldDisk]), oldDisk];

    expect(findReplacementNode([], branch)).toBeNull();
  });
});
