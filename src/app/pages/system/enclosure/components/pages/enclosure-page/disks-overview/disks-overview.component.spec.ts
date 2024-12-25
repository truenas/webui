import { byText } from '@ngneat/spectator';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { EnclosureDiskStatus, EnclosureElementType, EnclosureStatus } from 'app/enums/enclosure-slot-status.enum';
import {
  DashboardEnclosure,
  DashboardEnclosureElements,
  DashboardEnclosureSlot, EnclosureElement,
} from 'app/interfaces/enclosure.interface';
import { DisksOverviewComponent } from 'app/pages/system/enclosure/components/pages/enclosure-page/disks-overview/disks-overview.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { EnclosureView } from 'app/pages/system/enclosure/types/enclosure-view.enum';

const fakeDeviceSlot = {
  pool_info: {
    disk_status: EnclosureDiskStatus.Online,
  },
} as DashboardEnclosureSlot;

const fakeSelectedEnclosure = {
  id: 'enclosure-id',
  name: 'M50',
  label: 'My enclosure',
  elements: {
    [EnclosureElementType.ArrayDeviceSlot]: {
      1: fakeDeviceSlot,
    },
    [EnclosureElementType.SasExpander]: {
      2: {
        status: EnclosureStatus.Ok,
        descriptor: '',
      } as EnclosureElement,
      3: {
        status: EnclosureStatus.Ok,
        descriptor: '',
      } as EnclosureElement,
    },
  } as DashboardEnclosureElements,
} as DashboardEnclosure;

describe('DisksOverviewComponent', () => {
  let spectator: Spectator<DisksOverviewComponent>;

  const createComponent = createComponentFactory({
    component: DisksOverviewComponent,
    providers: [
      mockProvider(EnclosureStore, {
        selectedEnclosure: () => fakeSelectedEnclosure,
        selectedView: () => EnclosureView.DiskStatus,
        selectView: jest.fn(),
        selectedEnclosureSlots: () => {
          return Object.values(fakeSelectedEnclosure.elements[EnclosureElementType.ArrayDeviceSlot]);
        },
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows tiles', () => {
    const overview = spectator.queryAll('.disk-overview .tile').map((tile) => {
      return {
        number: tile.querySelector('.primary-number')?.textContent?.trim() || null,
        title: tile.querySelector('.title')?.textContent?.trim() || null,
        subtitle: tile.querySelector('.subtitle')?.textContent?.trim() || null,
      };
    });
    expect(overview).toEqual(
      [
        {
          number: '1',
          subtitle: 'All pools are online.',
          title: 'Pool in Enclosure',
        },
        {
          number: '0',
          subtitle: 'All disks healthy.',
          title: 'Failed Disks',
        },
        {
          number: '2',
          subtitle: 'on this enclosure.',
          title: 'SAS Expanders',
        },
      ],
    );
  });

  it('marks tile as active when it matches current view', () => {
    const activeTile = spectator.queryAll('.tile.active');

    expect(activeTile).toHaveLength(1);
    expect(activeTile[0]).toHaveText('All disks healthy');
  });

  it('selects a different view when user presses on the button in the tile', () => {
    spectator.click(byText('Show Expander Status'));

    expect(spectator.inject(EnclosureStore).selectView).toHaveBeenCalledWith(EnclosureView.Expanders);
  });
});
