import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import {
  PoolsLegendComponent,
} from 'app/pages/system/enclosure/components/pools-legend/pools-legend.component';

describe('PoolsLegendComponent', () => {
  let spectator: Spectator<PoolsLegendComponent>;
  const createComponent = createComponentFactory({
    component: PoolsLegendComponent,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        slots: [
          { pool_info: { pool_name: 'pool1' } },
          { pool_info: { pool_name: 'pool2' } },
          { pool_info: { pool_name: 'pool1' } },
          {},
        ] as DashboardEnclosureSlot[],
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
