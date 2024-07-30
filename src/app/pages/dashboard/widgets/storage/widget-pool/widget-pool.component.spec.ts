import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetDatapointComponent } from 'app/pages/dashboard/widgets/common/widget-datapoint/widget-datapoint.component';
import { DisksWithZfsErrorsComponent } from 'app/pages/dashboard/widgets/storage/widget-pool/common/disks-with-zfs-errors/disks-with-zfs-errors.component';
import { LastScanErrorsComponent } from 'app/pages/dashboard/widgets/storage/widget-pool/common/last-scan-errors/last-scan-errors.component';
import { PoolStatusComponent } from 'app/pages/dashboard/widgets/storage/widget-pool/common/pool-status/pool-status.component';
import { PoolUsageGaugeComponent } from 'app/pages/dashboard/widgets/storage/widget-pool/common/pool-usage-gauge/pool-usage-gauge.component';
import { WidgetPoolSettings } from 'app/pages/dashboard/widgets/storage/widget-pool/widget-pool.definition';
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

  const mockSettings: WidgetPoolSettings = {
    poolId: '1',
  };

  beforeEach(() => {
    spectator = createComponent({
      props: {
        size: SlotSize.Full,
        settings: mockSettings,
      },
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
