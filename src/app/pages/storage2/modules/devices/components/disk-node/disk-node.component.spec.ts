import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { DiskType } from 'app/enums/disk-type.enum';
import { VDevStatus } from 'app/enums/vdev-status.enum';
import { Disk, VDev } from 'app/interfaces/storage.interface';
import { DiskIconComponent } from 'app/pages/storage2/modules/devices/components/disk-icon/disk-icon.component';
import { DiskNodeComponent } from 'app/pages/storage2/modules/devices/components/disk-node/disk-node.component';

describe('DiskNodeComponent', () => {
  let spectator: Spectator<DiskNodeComponent>;
  const vdev = {
    type: 'DISK',
    path: null,
    guid: '123',
    status: VDevStatus.Offline,
    stats: {
      read_errors: 1,
      write_errors: 2,
      checksum_errors: 3,
    },
    children: [],
    disk: 'sdf',
  } as VDev;
  const disk = {
    type: DiskType.Hdd,
    size: 1024 * 1024 * 16,
  } as Disk;
  const createComponent = createComponentFactory({
    component: DiskNodeComponent,
    declarations: [
      MockComponent(DiskIconComponent),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: { disk, vdev },
    });
  });

  it('shows "Device Name"', () => {
    expect(spectator.query('.name')).toHaveText(vdev.disk);
    expect(spectator.query(DiskIconComponent).disk).toBe(disk);
    expect(spectator.query(DiskIconComponent).vdev).toBe(vdev);
  });

  it('shows "Status"', () => {
    expect(spectator.query('.cell-status span')).toHaveText(vdev.status);
    expect(spectator.component.statusColor).toEqual('var(--magenta)');
  });

  it('shows "Capacity"', () => {
    expect(spectator.query('.cell-capacity')).toHaveText('16.00MiB');
  });

  it('shows "Errors"', () => {
    expect(spectator.query('.cell-errors')).toHaveText('6 Errors');
  });
});
