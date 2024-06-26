import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
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

  // TODO: Rework how statuses are handled.
  beforeEach(() => {
    spectator = createComponent({
      props: {
        slots: [
          {
            dev: 'sda',
            status: 'FAILED',
          },
          {
            dev: 'sdb',
            status: 'OK',
            pool_info: {
              pool_name: 'pool1',
            },
          },
          {
            dev: 'sdc',
            status: 'OK',
            pool_info: {
              pool_name: 'pool2',
            },
          },
          {
            dev: null,
            status: 'OK',
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
