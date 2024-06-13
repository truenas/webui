import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { of } from 'rxjs';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { Pool } from 'app/interfaces/pool.interface';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { GaugeChartComponent } from 'app/pages/dashboard/widgets/storage/widget-pool/gauge-chart/gauge-chart.component';
import { WidgetPoolComponent } from 'app/pages/dashboard/widgets/storage/widget-pool/widget-pool.component';
import { ThemeService } from 'app/services/theme/theme.service';

describe('WidgetPoolComponent', () => {
  let spectator: Spectator<WidgetPoolComponent>;
  const createComponent = createComponentFactory({
    component: WidgetPoolComponent,
    imports: [
      NgxSkeletonLoaderModule,
    ],
    declarations: [
      MockComponent(GaugeChartComponent),
      FakeFormatDateTimePipe,
    ],
    providers: [
      mockProvider(ThemeService, {
        currentTheme: jest.fn(() => ({
          bg1: 'bg1',
          primary: 'primary',
          red: 'red',
        })),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        settings: {
          poolId: '1',
        },
        size: SlotSize.Full,
      },
      providers: [
        mockProvider(WidgetResourcesService, {
          getPoolById: jest.fn(() => of({
            name: 'Pool 1',
            id: 1,
            scan: {
              errors: 2,
              end_time: {
                $date: 1717916420000,
              },
            },
          } as Pool)),
          getDatasetById: jest.fn(() => of({
            id: '1',
            available: {
              parsed: 557187072,
            },
            used: {
              parsed: 2261385216,
            },
          })),
          getDisksByPoolId: jest.fn(() => of([])),
        }),
      ],
    });
    spectator.detectChanges();
  });

  it('shows pool name', () => {
    const poolName = spectator.query('.pool-name').textContent.trim();
    expect(poolName).toBe('Pool 1');
  });
});
