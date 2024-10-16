import { signal } from '@angular/core';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { DashboardEnclosure, DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { EnclosureSideComponent } from 'app/pages/system/enclosure/components/enclosure-side/enclosure-side.component';
import {
  EnclosureSideSwitchComponent,
} from 'app/pages/system/enclosure/components/pages/enclosure-page/enclosure-side-switch/enclosure-side-switch.component';
import {
  DiskTopologyDescriptionComponent,
} from 'app/pages/system/enclosure/components/pages/enclosure-page/pools-view/disk-topology-description/disk-topology-description.component';
import {
  PoolsViewComponent,
} from 'app/pages/system/enclosure/components/pages/enclosure-page/pools-view/pools-view.component';
import {
  VdevDisksLegendComponent,
} from 'app/pages/system/enclosure/components/pages/enclosure-page/pools-view/vdev-disks-legend/vdev-disks-legend.component';
import {
  PoolsLegendComponent,
} from 'app/pages/system/enclosure/components/pools-legend/pools-legend.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { EnclosureSide } from 'app/pages/system/enclosure/utils/supported-enclosures';

describe('PoolsViewComponent', () => {
  let spectator: Spectator<PoolsViewComponent>;
  const selectedSlot = signal<DashboardEnclosureSlot>(null);
  const createComponent = createComponentFactory({
    component: PoolsViewComponent,
    declarations: [
      MockComponents(
        EnclosureSideComponent,
        EnclosureSideSwitchComponent,
        DiskTopologyDescriptionComponent,
        VdevDisksLegendComponent,
        PoolsLegendComponent,
      ),
    ],
    providers: [
      mockProvider(EnclosureStore, {
        selectedSlot,
        selectedEnclosure: () => ({}) as DashboardEnclosure,
        selectedEnclosureSlots: () => ([]) as DashboardEnclosureSlot[],
        selectedSide: () => EnclosureSide.Front,
        hasMoreThanOneSide: () => true,
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

  it('renders currently selected enclosure side', () => {
    expect(spectator.query(EnclosureSideComponent)).toExist();
  });

  it('renders switch to select enclosure side', () => {
    expect(spectator.query(EnclosureSideSwitchComponent)).toExist();
  });

  describe('when slot is not selected', () => {
    it('shows pools header', () => {
      expect(spectator.query('h2')).toHaveText('Pools');
    });

    it('renders legend with all the pools', () => {
      expect(spectator.query(PoolsLegendComponent)).toExist();
    });
  });

  describe('when slot is selected', () => {
    beforeEach(() => {
      selectedSlot.set({
        pool_info: {
          pool_name: 'pool1',
        },
      } as DashboardEnclosureSlot);
      spectator.detectChanges();
    });

    it('disk topology description', () => {
      expect(spectator.query(DiskTopologyDescriptionComponent)).toExist();
    });

    it('renders legend with vdev disks', () => {
      const legend = spectator.query(VdevDisksLegendComponent);
      expect(legend).toExist();
      expect(legend.poolColor).toBe('red');
    });
  });
});
