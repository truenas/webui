import { TopologyItemType, VDevType } from 'app/enums/v-dev-type.enum';
import { VDevNestedDataNode } from 'app/interfaces/device-nested-data-node.interface';
import { deviceMatchesSearch } from 'app/pages/storage/modules/vdevs/utils/device-matches-search.utils';

describe('deviceMatchesSearch', () => {
  it('matches a disk by its device name, ignoring case', () => {
    const disk = { type: TopologyItemType.Disk, name: 'partuuid', disk: 'sdc' } as VDevNestedDataNode;

    expect(deviceMatchesSearch(disk, 'SD')).toBe(true);
    expect(deviceMatchesSearch(disk, 'partuuid')).toBe(false);
  });

  it('does not match a disk that has no device name', () => {
    const missingDisk = { type: TopologyItemType.Disk, name: 'partuuid', disk: null } as VDevNestedDataNode;

    expect(deviceMatchesSearch(missingDisk, 'sd')).toBe(false);
  });

  it('matches a vdev by its name', () => {
    const mirror = { type: TopologyItemType.Mirror, name: 'mirror-0' } as VDevNestedDataNode;

    expect(deviceMatchesSearch(mirror, 'mirror')).toBe(true);
    expect(deviceMatchesSearch(mirror, 'sd')).toBe(false);
  });

  it('never matches a group', () => {
    const group = { group: 'Data VDEVs', guid: VDevType.Data, children: [] } as VDevNestedDataNode;

    expect(deviceMatchesSearch(group, 'data')).toBe(false);
  });
});
