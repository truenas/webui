import { MatIcon } from '@angular/material/icon';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { DiskType } from 'app/enums/disk-type.enum';
import { VDevStatus } from 'app/enums/vdev-status.enum';
import { VDev } from 'app/interfaces/storage.interface';
import { DiskNodeComponent } from 'app/pages/storage2/modules/devices/components/disk-node/disk-node.component';

describe('DiskNodeComponent', () => {
  let spectator: Spectator<DiskNodeComponent>;
  const disk = {
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
  const type = DiskType.Hdd;
  const size = 1024 * 1024 * 16;
  const createComponent = createComponentFactory({
    component: DiskNodeComponent,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: { disk, type, size },
    });
  });

  it('shows "Device Name"', () => {
    expect(spectator.query('.name')).toHaveText('sdf');
    expect(spectator.query(MatIcon).svgIcon).toBe('ix-hdd');
  });

  it('shows "Status"', () => {
    expect(spectator.query('.cell-status span')).toHaveText('OFFLINE');
    expect(spectator.component.statusColor).toEqual('var(--magenta)');
  });

  it('shows "Capacity"', () => {
    expect(spectator.query('.cell-capacity')).toHaveText('16.00MiB');
  });

  it('shows "Errors"', () => {
    expect(spectator.query('.cell-errors')).toHaveText('6 Errors');
  });
});
