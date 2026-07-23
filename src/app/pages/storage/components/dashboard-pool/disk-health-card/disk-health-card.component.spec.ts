import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import {
  createComponentFactory, Spectator, mockProvider, byText,
} from '@ngneat/spectator/jest';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { DiskBus } from 'app/enums/disk-bus.enum';
import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { DiskType } from 'app/enums/disk-type.enum';
import { StorageDashboardDisk } from 'app/interfaces/disk.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DiskHealthCardComponent } from 'app/pages/storage/components/dashboard-pool/disk-health-card/disk-health-card.component';
import { PoolCardIconComponent } from 'app/pages/storage/components/dashboard-pool/pool-card-icon/pool-card-icon.component';
import { PoolsDashboardStore } from 'app/pages/storage/stores/pools-dashboard-store.service';

const disks: StorageDashboardDisk[] = [
  {
    advpowermgmt: DiskPowerLevel.Disabled,
    bus: DiskBus.Spi,
    description: '',
    devname: 'sdd',
    duplicate_serial: [],
    expiretime: '',
    hddstandby: DiskStandby.AlwaysOn,
    identifier: '{uuid}b3ba146f-1ab6-4a45-ae6b-37ea00baf0aa',
    model: 'VMware_Virtual_S',
    name: 'sdd',
    number: 2096,
    pool: 'lio',
    rotationrate: 0,
    serial: '',
    size: 5368709120,
    subsystem: 'scsi',
    transfermode: 'Auto',
    type: DiskType.Hdd,
    zfs_guid: '12387051346845729003',
    alerts: [],
    tempAggregates: { min: 10, max: 50, avg: 30 },
  },
];

describe('DiskHealthCardComponent', () => {
  let spectator: Spectator<DiskHealthCardComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: DiskHealthCardComponent,
    imports: [
      NgxSkeletonLoaderModule,
      PoolCardIconComponent,
    ],
    providers: [
      mockProvider(PoolsDashboardStore),
      mockProvider(SnackbarService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        poolState: { id: 1, name: 'DEV' } as Pool,
        disks,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows a button to manage all disks', async () => {
    const manageDisksButton = await loader.getHarness(MatButtonHarness.with({ text: 'View Disks' }));

    expect(manageDisksButton).toBeTruthy();
    expect(await (await manageDisksButton.host()).getAttribute('href')).toBe('/storage/disks');
  });

  describe('Temperatures', () => {
    it('shows disks temperature related alerts', () => {
      const detailsItem = spectator.query(byText('Disks temperature related alerts:'))!.parentElement!;
      expect(detailsItem.querySelector('.value')).toHaveText('0');
    });

    it('shows highest temperature', () => {
      const detailsItem = spectator.query(byText('Highest Temperature:'))!.parentElement!;
      expect(detailsItem.querySelector('.value')).toHaveText('50 °C');
    });

    it('shows lowest temperature', () => {
      const detailsItem = spectator.query(byText('Lowest Temperature:'))!.parentElement!;
      expect(detailsItem.querySelector('.value')).toHaveText('10 °C');
    });

    it('shows average temperature', () => {
      const detailsItem = spectator.query(byText('Average Disk Temperature:'))!.parentElement!;
      expect(detailsItem.querySelector('.value')).toHaveText('30 °C');
    });

    it('ignores devices without SMART temperature values when aggregating', () => {
      spectator.setInput('disks', [
        ...disks,
        {
          ...disks[0],
          devname: 'pmem0',
          name: 'pmem0',
          tempAggregates: { min: null, max: null, avg: null },
        } as StorageDashboardDisk,
      ]);

      expect(spectator.query(byText('Highest Temperature:'))!.parentElement!.querySelector('.value'))
        .toHaveText('50 °C');
      expect(spectator.query(byText('Lowest Temperature:'))!.parentElement!.querySelector('.value'))
        .toHaveText('10 °C');
      expect(spectator.query(byText('Average Disk Temperature:'))!.parentElement!.querySelector('.value'))
        .toHaveText('30 °C');
      expect(spectator.query(byText('No disk temperature is available.'))).toBeNull();
    });

    it('recomputes extremes without retaining stale values when disks input changes', () => {
      spectator.setInput('disks', [
        {
          ...disks[0], devname: 'sda', name: 'sda', tempAggregates: { min: 10, max: 50, avg: 30 },
        },
        {
          ...disks[0], devname: 'sdb', name: 'sdb', tempAggregates: { min: 20, max: 40, avg: 30 },
        },
      ] as StorageDashboardDisk[]);

      // Remove the disk holding both extremes (10/50) — the panel must reflect the survivor (20/40).
      spectator.setInput('disks', [
        {
          ...disks[0], devname: 'sdb', name: 'sdb', tempAggregates: { min: 20, max: 40, avg: 30 },
        },
      ] as StorageDashboardDisk[]);

      expect(spectator.query(byText('Highest Temperature:'))!.parentElement!.querySelector('.value'))
        .toHaveText('40 °C');
      expect(spectator.query(byText('Lowest Temperature:'))!.parentElement!.querySelector('.value'))
        .toHaveText('20 °C');
    });
  });
});
