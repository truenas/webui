import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { GiB } from 'app/constants/bytes.constant';
import { DiskType } from 'app/enums/disk-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
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
        } as DetailsDisk,
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
    } as DetailsDisk);

    expect(spectator.query('#ssd')).toExist();
  });
});
