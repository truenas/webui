import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { of } from 'rxjs';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
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
      FileSizePipe,
    ],
    declarations: [
      MockComponent(GaugeChartComponent),
      FakeFormatDateTimePipe,
    ],
    providers: [
      mockWebSocket([]),
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

  it('shows pool name', () => {
    const poolName = spectator.query('.pool-name').textContent.trim();
    expect(poolName).toBe('Pool 1');
  });

  it('shows lines', () => {
    const lines: { label: string; value: string }[] = [];
    spectator.queryAll('.lines > .line').forEach((line) => {
      lines.push({
        label: line.querySelector('.label').textContent.trim(),
        value: line.querySelector('.value').textContent.trim(),
      });
    });
    expect(lines).toEqual([
      { label: 'Data Topology:', value: '2 x DISK | 1 wide | 5 GiB' },
      { label: 'Usable Capacity:', value: '2.63 GiB' },
      { label: 'Last Scrub Date:', value: '2024-06-09 10:00:20' },
      { label: 'Last Scan Duration:', value: '1 minute 40 seconds' },
    ]);
  });

  it('shows chart', () => {
    expect(spectator.query(GaugeChartComponent).label).toBe('80.2%');
    expect(Math.round(spectator.query(GaugeChartComponent).value)).toBe(80);
    expect(spectator.query(GaugeChartComponent).colorFill).toBe('red');
  });

  it('shows bottom cards', () => {
    const cards: { label: string; value: string }[] = [];
    spectator.queryAll('.pool-info-bottom > div').forEach((card) => {
      cards.push({
        label: card.querySelector('.label').textContent.trim(),
        value: card.querySelector('.value').textContent.trim(),
      });
    });
    expect(cards).toEqual([
      { label: 'Pool Status', value: 'ONLINE' },
      { label: 'Disks w/ZFS Errors', value: '6' },
      { label: 'Last Scan Errors', value: '2' },
    ]);
  });
});
