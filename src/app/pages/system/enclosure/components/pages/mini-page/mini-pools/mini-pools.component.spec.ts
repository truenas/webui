import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { DashboardEnclosure } from 'app/interfaces/enclosure.interface';
import {
  MiniPoolsComponent,
} from 'app/pages/system/enclosure/components/pages/mini-page/mini-pools/mini-pools.component';
import { PoolsLegendComponent } from 'app/pages/system/enclosure/components/pools-legend/pools-legend.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { EnclosureSide } from 'app/pages/system/enclosure/utils/supported-enclosures';

describe('MiniPoolsComponent', () => {
  let spectator: Spectator<MiniPoolsComponent>;
  const createComponent = createComponentFactory({
    component: MiniPoolsComponent,
    declarations: [
      MockComponent(PoolsLegendComponent),
    ],
    providers: [
      mockProvider(EnclosureStore, {
        selectedEnclosure: () => ({} as DashboardEnclosure),
        selectedSide: () => EnclosureSide.Front,
        poolColors: () => ({
          pool1: 'red',
          pool2: 'green',
        }),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('renders legend with all the pools', () => {
    expect(spectator.query(PoolsLegendComponent)).toExist();
  });
});
