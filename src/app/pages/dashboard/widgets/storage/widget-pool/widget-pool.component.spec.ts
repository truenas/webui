import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetDatapointComponent } from 'app/pages/dashboard/widgets/common/widget-datapoint/widget-datapoint.component';
import { DisksWithZfsErrorsComponent } from 'app/pages/dashboard/widgets/storage/widget-pool/common/disks-with-zfs-errors/disks-with-zfs-errors.component';
import { LastScanErrorsComponent } from 'app/pages/dashboard/widgets/storage/widget-pool/common/last-scan-errors/last-scan-errors.component';
import { PoolStatusComponent } from 'app/pages/dashboard/widgets/storage/widget-pool/common/pool-status/pool-status.component';
import { PoolUsageGaugeComponent } from 'app/pages/dashboard/widgets/storage/widget-pool/common/pool-usage-gauge/pool-usage-gauge.component';
import { WidgetPoolComponent } from './widget-pool.component';

describe('WidgetPoolComponent', () => {
  let spectator: Spectator<WidgetPoolComponent>;
  const createComponent = createComponentFactory({
    component: WidgetPoolComponent,
    declarations: [
      MockComponent(IxIconComponent),
      MockComponent(PoolUsageGaugeComponent),
      MockComponent(PoolStatusComponent),
      MockComponent(DisksWithZfsErrorsComponent),
      MockComponent(LastScanErrorsComponent),
      MockComponent(WidgetDatapointComponent),
    ],
    providers: [
      mockProvider(WidgetResourcesService, {
        getPoolById: jest.fn().mockReturnValue(of({
          name: 'Test Pool',
          status: 'Online',
          topology: {
            data: [
              {
                type: 'raidz2',
                children: [
                  {
                    disk: 'sda',
                  },
                ],
              },
            ],
          },
          scan: {
            end_time: { $date: 1687455632000 },
            start_time: { $date: 1687452032000 },
          },
        })),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        settings: {
          poolId: 1,
        },
        size: SlotSize.Full,
      },
      providers: [
        mockProvider(WidgetResourcesService, {
          getPoolById: jest.fn(() => of({
            name: 'Pool 1',
            id: 1,
            status: PoolStatus.Online,
            scan: {
              errors: 2,
              start_time: {
                $date: 1717916320000,
              },
              end_time: {
                $date: 1717916420000,
              },
            },
            topology: {
              data: [
                {
                  children: [],
                  disk: 'sda',
                  type: TopologyItemType.Disk,
                  stats: {
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                },
                {
                  children: [],
                  disk: 'sdb',
                  type: TopologyItemType.Disk,
                  stats: {
                    read_errors: 1,
                    write_errors: 2,
                    checksum_errors: 3,
                  },
                },
              ],
            },
          } as Pool)),
          getDatasetById: jest.fn(() => of({
            id: 1,
            available: {
              parsed: 557187072,
            },
            used: {
              parsed: 2261385216,
            },
          })),
          getDisksByPoolId: jest.fn(() => of([
            { name: 'sda', size: 1024 ** 3 * 5 },
            { name: 'sdb', size: 1024 ** 3 * 5 },
          ] as Disk[])),
        }),
      ],
    });
  });

  it('should display pool name when pool exists', () => {
    expect(spectator.query('h3')).toHaveText('Pool');
  });

  it('should have pool info components', () => {
    expect(spectator.query(PoolUsageGaugeComponent)).toBeTruthy();
    expect(spectator.query(PoolStatusComponent)).toBeTruthy();
    expect(spectator.query(DisksWithZfsErrorsComponent)).toBeTruthy();
    expect(spectator.query(LastScanErrorsComponent)).toBeTruthy();
  });

  it('should have a disk reports button', () => {
    expect(spectator.query('button[aria-label="Disk Reports"]')).toBeTruthy();
  });
});
