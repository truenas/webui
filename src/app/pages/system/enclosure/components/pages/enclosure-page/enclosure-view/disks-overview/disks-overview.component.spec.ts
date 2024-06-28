import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { DiskType } from 'app/enums/disk-type.enum';
import { EnclosureDiskStatus, EnclosureElementType } from 'app/enums/enclosure-slot-status.enum';
import { VdevType } from 'app/enums/v-dev-type.enum';
import { DashboardEnclosure, DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { IxFileSizePipe } from 'app/modules/pipes/ix-file-size/ix-file-size.pipe';
import { DisksOverviewDetailsComponent } from 'app/pages/system/enclosure/components/pages/enclosure-page/enclosure-view/disks-overview/disks-overview-details/disks-overview-details.component';
import { DisksOverviewTilesComponent } from 'app/pages/system/enclosure/components/pages/enclosure-page/enclosure-view/disks-overview/disks-overview-tiles/disks-overview-tiles.component';
import { DisksOverviewComponent } from 'app/pages/system/enclosure/components/pages/enclosure-page/enclosure-view/disks-overview/disks-overview.component';
import { EnclosureDiskComponent } from 'app/pages/system/enclosure/components/pages/enclosure-page/enclosure-view/disks-overview/enclosure-disk/enclosure-disk.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { EnclosureView } from 'app/pages/system/enclosure/types/enclosure-view.enum';

const fakeDeviceSlot = {
  descriptor: 'slot1',
  status: 'OK',
  dev: 'sdm',
  supports_identify_light: true,
  drive_bay_number: 18,
  size: 15 * 1024 ** 2,
  model: 'HUH721212AL4200',
  serial: '8HG7MW3H',
  type: DiskType.Hdd,
  rotationrate: 7200,
  pool_info: {
    pool_name: 'test pool',
    disk_status: EnclosureDiskStatus.Online,
    disk_read_errors: 0,
    disk_write_errors: 0,
    disk_checksum_errors: 0,
    vdev_name: 'stripe',
    vdev_type: VdevType.Data,
    vdev_disks: [
      {
        enclosure_id: '5b0bd6d1a30714bf',
        slot: 18,
        dev: 'sdm',
      },
    ],
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
        status: 'OK',
        descriptor: '',
      },
      3: {
        status: 'OK',
        descriptor: '',
      },
    },
  },
} as unknown as DashboardEnclosure;

describe('DisksOverviewComponent', () => {
  let spectator: Spectator<DisksOverviewComponent>;

  const createComponent = createComponentFactory({
    component: DisksOverviewComponent,
    imports: [
      IxFileSizePipe,
    ],
    providers: [
      mockProvider(EnclosureStore, {
        selectedEnclosure: () => fakeSelectedEnclosure,
        selectedSlot: () => fakeDeviceSlot,
      }),
    ],
    declarations: [
      MockComponent(EnclosureDiskComponent),
      DisksOverviewTilesComponent,
      DisksOverviewDetailsComponent,
    ],
  });

  describe('overview details', () => {
    beforeEach(() => {
      spectator = createComponent();
    });

    it('shows disk', () => {
      expect(spectator.query(EnclosureDiskComponent).data).toEqual({
        name: 'sdm',
        type: 'HDD',
      });
    });

    it('shows capacity', () => {
      expect(spectator.query('.capacity').textContent).toBe('15 MiB');
    });

    it('shows details', () => {
      const details = spectator.queryAll('.details .detail').map((detail) => {
        return {
          label: detail.querySelector('.label')?.textContent?.trim() || null,
          value: detail.querySelector('.value')?.textContent?.trim() || null,
        };
      });
      expect(details).toEqual(
        [
          { label: 'Pool', value: 'test pool' },
          { label: 'Model', value: 'HUH721212AL4200' },
          { label: 'Serial', value: '8HG7MW3H' },
          { label: 'Status', value: 'ONLINE' },
          { label: 'Rotation Rate', value: '7200 RPM' },
        ],
      );
    });
  });

  describe('overview tiles', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(EnclosureStore, {
            selectedEnclosure: () => fakeSelectedEnclosure,
            selectedSlot: () => null as DashboardEnclosureSlot,
            selectedView: () => null as EnclosureView,
          }),
        ],
      });
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
  });
});
