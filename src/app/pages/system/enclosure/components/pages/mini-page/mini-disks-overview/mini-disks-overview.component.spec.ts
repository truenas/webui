import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { EnclosureDiskStatus } from 'app/enums/enclosure-slot-status.enum';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import {
  MiniDisksOverviewComponent,
} from 'app/pages/system/enclosure/components/pages/mini-page/mini-disks-overview/mini-disks-overview.component';
import { getItemValueFactory } from 'app/pages/system/enclosure/utils/get-item-value-factory.utils';

describe('MiniDisksOverviewComponent', () => {
  let spectator: Spectator<MiniDisksOverviewComponent>;
  const createComponent = createComponentFactory({
    component: MiniDisksOverviewComponent,
  });

  let getItemValue: (name: string) => string;

  beforeEach(() => {
    spectator = createComponent({
      props: {
        slots: [
          {
            dev: 'sda',
          },
          {
            dev: 'sdb',
            pool_info: {
              disk_status: EnclosureDiskStatus.Online,
              pool_name: 'pool1',
            },
          },
          {
            dev: 'sdc',
            pool_info: {
              disk_status: EnclosureDiskStatus.Faulted,
              pool_name: 'pool2',
            },
          },
          {
            dev: null,
          },
        ] as DashboardEnclosureSlot[],
      },
    });

    getItemValue = getItemValueFactory(spectator);
  });

  it('shows total number of pools in the system', () => {
    expect(getItemValue('Pools:')).toBe('2');
  });

  it('shows total number of installed disks', () => {
    expect(getItemValue('Total Disks:')).toBe('3');
  });

  it('shows a number of failed disks', () => {
    expect(getItemValue('Failed Disks:')).toBe('1');
  });
});
