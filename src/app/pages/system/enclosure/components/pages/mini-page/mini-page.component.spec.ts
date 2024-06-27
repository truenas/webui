import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { EnclosureElementType } from 'app/enums/enclosure-slot-status.enum';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import {
  MiniDisksOverviewComponent,
} from 'app/pages/system/enclosure/components/pages/mini-page/mini-disks-overview/mini-disks-overview.component';
import {
  MiniDriveDetailsComponent,
} from 'app/pages/system/enclosure/components/pages/mini-page/mini-drive-details/mini-drive-details.component';
import {
  MiniDriveStatsComponent,
} from 'app/pages/system/enclosure/components/pages/mini-page/mini-drive-stats/mini-drive-stats.component';
import {
  MiniDriveTemperaturesComponent,
} from 'app/pages/system/enclosure/components/pages/mini-page/mini-drive-temperatures/mini-drive-temperatures.component';
import {
  MiniEnclosureComponent,
} from 'app/pages/system/enclosure/components/pages/mini-page/mini-enclosure/mini-enclosure.component';
import { MiniPageComponent } from 'app/pages/system/enclosure/components/pages/mini-page/mini-page.component';
import {
  MiniPoolsComponent,
} from 'app/pages/system/enclosure/components/pages/mini-page/mini-pools/mini-pools.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';

describe('MiniPageComponent', () => {
  let spectator: Spectator<MiniPageComponent>;
  const slots = [
    { dev: 'ada1', is_front: true },
    { dev: 'ada2', is_front: true },
  ] as DashboardEnclosureSlot[];

  const createComponent = createComponentFactory({
    component: MiniPageComponent,
    declarations: [
      MockComponents(
        MiniPoolsComponent,
        MiniEnclosureComponent,
        MiniDriveDetailsComponent,
        MiniDriveStatsComponent,
        MiniDisksOverviewComponent,
        MiniDriveTemperaturesComponent,
      ),
    ],
    providers: [
      mockProvider(EnclosureStore, {
        enclosureLabel: () => 'MINI-X',
        selectedSlot: jest.fn(() => null),
        selectedEnclosure: () => ({
          elements: {
            [EnclosureElementType.ArrayDeviceSlot]: {
              1: slots[0],
              2: slots[1],
            },
          },
        }),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows a header with enclosure label', () => {
    const header = spectator.query('mat-card-header');
    expect(header).toHaveText('MINI-X');
  });

  it('shows pools and enclosure components', () => {
    const pools = spectator.query(MiniPoolsComponent);
    expect(pools).toExist();
    expect(pools.slots).toMatchObject(slots);

    const enclosures = spectator.query(MiniEnclosureComponent);
    expect(enclosures).toExist();
  });

  describe('when no slot is selected', () => {
    it('shows disks overview and temperatures components', () => {
      const disksOverview = spectator.query(MiniDisksOverviewComponent);
      expect(disksOverview).toExist();
      expect(disksOverview.slots).toMatchObject(slots);

      const temperatures = spectator.query(MiniDriveTemperaturesComponent);
      expect(temperatures).toExist();
    });
  });

  describe('when a slot is selected', () => {
    it('shows drive details and drive stats components', () => {
      spectator.inject(EnclosureStore).selectedSlot.mockReturnValue(slots[0]);
      spectator.detectComponentChanges();

      const driveDetails = spectator.query(MiniDriveDetailsComponent);
      expect(driveDetails).toExist();

      const driveStats = spectator.query(MiniDriveStatsComponent);
      expect(driveStats).toExist();
      expect(driveStats.slot).toMatchObject(slots[0]);
    });
  });
});
