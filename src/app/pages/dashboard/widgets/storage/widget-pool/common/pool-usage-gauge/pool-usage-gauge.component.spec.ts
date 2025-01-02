import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { of } from 'rxjs';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { GaugeChartComponent } from 'app/modules/charts/gauge-chart/gauge-chart.component';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { ThemeService } from 'app/modules/theme/theme.service';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { PoolUsageGaugeComponent } from './pool-usage-gauge.component';

describe('PoolUsageGaugeComponent', () => {
  let spectator: Spectator<PoolUsageGaugeComponent>;
  const createComponent = createComponentFactory({
    component: PoolUsageGaugeComponent,
    imports: [
      NgxSkeletonLoaderModule,
      FileSizePipe,
      MockComponent(GaugeChartComponent),
    ],
    declarations: [
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

  const mockPool = {
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
  } as Pool;

  beforeEach(() => {
    spectator = createComponent({
      props: {
        pool: mockPool,
      },
      providers: [
        mockProvider(WidgetResourcesService, {
          getDatasetById: jest.fn(() => of({
            id: '1',
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
    spectator.detectChanges();
  });

  it('should display pool name when pool is loaded', () => {
    expect(spectator.query('.pool-name')).toHaveText('Pool 1');
  });

  it('shows lines', () => {
    const lines: { label: string; value: string }[] = [];
    spectator.queryAll('.lines > .line').forEach((line) => {
      lines.push({
        label: line.querySelector('.label')!.textContent!.trim(),
        value: line.querySelector('.value')!.textContent!.trim(),
      });
    });
    expect(lines).toEqual([
      { label: 'Pool Usage:', value: '80.2%' },
      { label: 'Data Topology:', value: '2 x DISK | 1 wide | 5 GiB' },
      { label: 'Usable Capacity:', value: '2.63 GiB' },
      { label: 'Last Scrub Date:', value: '2024-06-09 10:00:20' },
      { label: 'Last Scan Duration:', value: '1 minute 40 seconds' },
    ]);
  });

  it('should display gauge chart when dataset is loaded', () => {
    expect(spectator.query('ix-gauge-chart')).toBeTruthy();
  });

  it('shows chart', () => {
    expect(spectator.query(GaugeChartComponent)!.label).toBe('80.2%');
    const value = spectator.query(GaugeChartComponent)!.value;
    expect(value).toBeCloseTo(80, 0);
    expect(spectator.query(GaugeChartComponent)!.colorFill).toBe('red');
  });

  it('should display skeleton loader when pool is loading', () => {
    spectator.setInput('pool', null);
    expect(spectator.query('ngx-skeleton-loader')).toBeTruthy();
  });
});
