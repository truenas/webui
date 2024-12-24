import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { GiB } from 'app/constants/bytes.constant';
import { DiskType } from 'app/enums/disk-type.enum';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { DiskIconComponent } from 'app/modules/disk-icon/disk-icon.component';
import {
  MiniDriveStatsComponent,
} from 'app/pages/system/enclosure/components/pages/mini-page/mini-drive-stats/mini-drive-stats.component';
import { getItemValueFactory } from 'app/pages/system/enclosure/utils/get-item-value-factory.utils';

describe('MiniDriveStatsComponent', () => {
  let spectator: Spectator<MiniDriveStatsComponent>;
  const createComponent = createComponentFactory({
    component: MiniDriveStatsComponent,
    declarations: [
      MockComponent(DiskIconComponent),
    ],
  });

  let getItemValue: (name: string) => string;

  beforeEach(() => {
    spectator = createComponent({
      props: {
        slot: {
          dev: 'ada1',
          type: DiskType.Hdd,
          size: 10 * GiB,
          pool_info: {
            disk_write_errors: 14,
            disk_checksum_errors: 3,
            disk_read_errors: 123,
          },
        } as DashboardEnclosureSlot,
      },
    });

    getItemValue = getItemValueFactory(spectator);
  });

  it('shows a disk icon', () => {
    const icon = spectator.query(DiskIconComponent)!;
    expect(icon).toExist();
    expect(icon.name).toBe('ada1');
    expect(icon.type).toBe(DiskType.Hdd);
    expect(icon.size).toBe(10 * GiB);
  });

  it('shows read errors', () => {
    expect(getItemValue('Read Errors:')).toMatch('123');
  });

  it('shows write errors', () => {
    expect(getItemValue('Write Errors:')).toMatch('14');
  });

  it('shows checksum errors', () => {
    expect(getItemValue('Checksum Errors:')).toMatch('3');
  });

  it('shows a different message when disk is not part of the pool', () => {
    spectator.setInput('slot', {
      dev: 'ada1',
      type: DiskType.Hdd,
      size: 10 * GiB,
    } as DashboardEnclosureSlot);

    const message = spectator.query('.no-pool');
    expect(message).toExist();
    expect(message).toHaveText('Must be part of the pool to check errors.');
  });
});
