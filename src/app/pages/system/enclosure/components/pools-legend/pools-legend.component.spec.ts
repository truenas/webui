import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { EnclosureElementType } from 'app/enums/enclosure-slot-status.enum';
import {
  DashboardEnclosure,
  DashboardEnclosureElements,
  DashboardEnclosureSlot,
} from 'app/interfaces/enclosure.interface';
import {
  PoolsLegendComponent,
} from 'app/pages/system/enclosure/components/pools-legend/pools-legend.component';
import { EnclosureSide } from 'app/pages/system/enclosure/utils/supported-enclosures';

describe('PoolsLegendComponent', () => {
  let spectator: Spectator<PoolsLegendComponent>;
  const createComponent = createComponentFactory({
    component: PoolsLegendComponent,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        enclosure: {
          elements: {
            [EnclosureElementType.ArrayDeviceSlot]: {
              1: { pool_info: { pool_name: 'pool1' }, is_front: true } as DashboardEnclosureSlot,
              2: { pool_info: { pool_name: 'pool2' }, is_front: true } as DashboardEnclosureSlot,
              3: { pool_info: null, is_front: true } as DashboardEnclosureSlot,
            },
          } as DashboardEnclosureElements,
        } as DashboardEnclosure,
        side: EnclosureSide.Front,
        poolColors: {
          pool1: 'red',
          pool2: 'blue',
        },
      },
    });
  });

  it('shows a list of pools present in slots and their colors', () => {
    const lines = spectator.queryAll('.line');

    expect(lines).toHaveLength(3);
    expect(lines[0]).toHaveText('pool1');
    expect(lines[0].querySelector('.disk-circle')).toHaveStyle({ background: 'red' });
    expect(lines[1]).toHaveText('pool2');
    expect(lines[1].querySelector('.disk-circle')).toHaveStyle({ background: 'blue' });
    expect(lines[2]).toHaveText('Unassigned');
    // Last line has grey color, but it's impossible to test because CSS variables are not rendered in JSDOM.
  });
});
