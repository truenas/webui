import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { GiB } from 'app/constants/bytes.constant';
import { DiskType } from 'app/enums/disk-type.enum';
import {
  DiskIconComponent,
} from 'app/modules/disk-icon/disk-icon.component';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';

describe('DiskIconComponent', () => {
  let spectator: Spectator<DiskIconComponent>;
  const createComponent = createComponentFactory({
    component: DiskIconComponent,
    imports: [
      FileSizePipe,
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        name: 'sda',
        size: 2 * GiB,
        type: DiskType.Hdd,
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
    spectator.setInput({
      type: DiskType.Ssd,
      size: 2 * GiB,
    });

    expect(spectator.query('#ssd')).toExist();
  });
});
