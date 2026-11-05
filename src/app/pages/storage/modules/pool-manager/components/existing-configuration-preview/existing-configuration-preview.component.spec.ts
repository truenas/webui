import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TiB } from 'app/constants/bytes.constant';
import { DiskType } from 'app/enums/disk-type.enum';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { PoolTopology } from 'app/interfaces/pool.interface';
import { VDevItem } from 'app/interfaces/storage.interface';
import {
  ExistingConfigurationPreviewComponent,
} from 'app/pages/storage/modules/pool-manager/components/existing-configuration-preview/existing-configuration-preview.component';

const leaf = (disk: string): VDevItem => ({ type: TopologyItemType.Disk, disk, children: [] } as unknown as VDevItem);
const mirror = (...disks: string[]): VDevItem => ({
  type: TopologyItemType.Mirror,
  children: disks.map(leaf),
} as unknown as VDevItem);

const disk = (devname: string, size: number, type = DiskType.Hdd): DetailsDisk => ({
  devname,
  size,
  type,
} as DetailsDisk);

const disks = [
  disk('sda', TiB),
  disk('sdb', TiB),
  disk('sdc', TiB),
  disk('sdd', TiB),
  disk('nvme0', TiB, DiskType.Ssd),
  disk('sde', 2 * TiB),
];

const topology = (overrides: Partial<PoolTopology> = {}): PoolTopology => ({
  data: [mirror('sda', 'sdb'), mirror('sdc', 'sdd')],
  log: [leaf('nvme0')],
  cache: [],
  spare: [],
  special: [],
  dedup: [],
  ...overrides,
} as PoolTopology);

describe('ExistingConfigurationPreviewComponent', () => {
  let spectator: Spectator<ExistingConfigurationPreviewComponent>;

  const createComponent = createComponentFactory({
    component: ExistingConfigurationPreviewComponent,
  });

  const valueOf = (label: string): string => {
    const item = spectator.queryAll('.details-item')
      .find((row) => row.querySelector('.label')!.textContent!.trim() === `${label}:`);
    return item!.querySelector('.value')!.textContent!.trim();
  };

  beforeEach(() => {
    spectator = createComponent({
      props: {
        name: 'tank',
        topology: topology(),
        disks,
        size: 4 * TiB,
      },
    });
  });

  it('shows the pool name and total capacity', () => {
    expect(valueOf('Name')).toBe('tank');
    expect(valueOf('Total Capacity')).toBe('4 TiB');
  });

  it('describes each category that has vdevs, and skips empty ones', () => {
    const labels = spectator.queryAll('.details-item .label').map((label) => label.textContent!.trim());

    expect(labels).toEqual(['Name:', 'Data:', 'Log:', 'Total Capacity:']);
    expect(valueOf('Data')).toBe('2 × MIRROR | 2 × 1 TiB (HDD)');
    expect(valueOf('Log')).toBe('1 × STRIPE | 1 × 1 TiB (SSD)');
  });

  it('reports a manual layout when the vdevs in a category differ', () => {
    spectator.setInput('topology', topology({ data: [mirror('sda', 'sdb'), mirror('sdc', 'sde')] }));

    expect(valueOf('Data')).toBe('Manual layout | 2 VDEVs');
  });

  it('reports a manual layout when vdev widths differ', () => {
    spectator.setInput('topology', topology({ data: [mirror('sda', 'sdb'), mirror('sdc', 'sdd', 'sde')] }));

    expect(valueOf('Data')).toBe('Manual layout | 2 VDEVs');
  });

  it('re-describes the pool when only the disk details change', () => {
    spectator.setInput('disks', disks.map((item) => ({ ...item, size: 2 * TiB })));

    expect(valueOf('Data')).toBe('2 × MIRROR | 2 × 2 TiB (HDD)');
  });

  it('keeps the description when only the name or size changes', () => {
    spectator.setInput({ name: 'backup', size: 8 * TiB });

    expect(valueOf('Name')).toBe('backup');
    expect(valueOf('Data')).toBe('2 × MIRROR | 2 × 1 TiB (HDD)');
  });
});
