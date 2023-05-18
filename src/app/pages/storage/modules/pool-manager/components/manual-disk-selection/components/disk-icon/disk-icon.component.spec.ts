import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { GiB } from 'app/constants/bytes.constant';
import { DiskType } from 'app/enums/disk-type.enum';
import { Disk } from 'app/interfaces/storage.interface';
import {
  DiskIconComponent,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/components/disk-icon/disk-icon.component';

describe('DiskIconComponent', () => {
  let spectator: Spectator<DiskIconComponent>;
  const createComponent = createComponentFactory({
    component: DiskIconComponent,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        disk: {
          name: 'sda',
          size: 2 * GiB,
          type: DiskType.Hdd,
        } as Disk,
      },
    });
  });

  it('shows disk size', () => {
    expect(spectator.query('#disk-size')).toHaveText('2 GiB');
  });

  it('shows disk name', () => {
    expect(spectator.query('#disk-identifier')).toHaveText('sda');
  });

  it('shows HDD icon when type is HDD', () => {
    expect(spectator.query('#harddisk')).toExist();
  });

  it('shows SSD icon when type is SSD', () => {
    spectator.setInput('disk', {
      type: DiskType.Ssd,
      size: 2 * GiB,
    } as Disk);

    expect(spectator.query('#ssd')).toExist();
  });
});
