import { fakeAsync } from '@angular/core/testing';
import { Spectator } from '@ngneat/spectator';
import { mockProvider, createComponentFactory } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { LoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { AppStats } from 'app/interfaces/app.interface';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { ThemeService } from 'app/modules/theme/theme.service';
import { AppDiskInfoComponent } from 'app/pages/dashboard/widgets/apps/common/app-disk-info/app-disk-info.component';
import { RateChartComponent } from 'app/pages/dashboard/widgets/network/common/rate-chart/rate-chart.component';

describe('AppDiskInfoComponent', () => {
  let spectator: Spectator<AppDiskInfoComponent>;
  const createComponent = createComponentFactory({
    component: AppDiskInfoComponent,
    imports: [FileSizePipe],
    declarations: [
      MockComponent(RateChartComponent),
    ],
    providers: [
      mockProvider(ThemeService, {
        currentTheme: () => ({ blue: '#0000FF', orange: '#FFA500' }),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        stats: {
          isLoading: false,
          error: null,
          value: {
            blkio: {
              read: 1234567,
              write: 2345678,
            },
          },
        } as LoadingState<AppStats>,
      },
    });
  });

  it('checks title', () => {
    const title = spectator.query('h4');
    expect(title).toHaveText('Block I/O');
  });

  it('checks read-write rows', () => {
    const readWriteRows = spectator.queryAll('.in-out-row');
    expect(readWriteRows[0]).toHaveText('Read: 1.18 MiB');
    expect(readWriteRows[1]).toHaveText('Write: 2.24 MiB');
  });

  it('passes bytes unit to rate chart for disk I/O', () => {
    const chartComponent = spectator.query(RateChartComponent)!;
    expect(chartComponent.unit).toBe('B');
  });

  it('updates chart with delta of disk stats', fakeAsync(() => {
    const chartComponent = spectator.query(RateChartComponent)!;
    expect(chartComponent).toBeTruthy();

    spectator.tick(1);

    const makeEmptyPoints = (y = 0, points = 59): { x: number; y: number }[] => {
      return Array.from({ length: points }, (_, i) => ({
        x: expect.closeTo(Date.now() - (points - i) * 1000, -2) as number,
        y,
      }));
    };

    expect(chartComponent.data).toEqual({
      datasets: [
        {
          label: 'Read',
          data: [
            ...makeEmptyPoints(),
            { x: expect.closeTo(Date.now(), -2) as number, y: 0 },
          ],
          borderColor: '#0000FF',
          backgroundColor: '#0000FF',
          pointBackgroundColor: '#0000FF',
          pointRadius: 0,
          tension: 0.2,
          fill: true,
        },
        {
          label: 'Write',
          data: [
            ...makeEmptyPoints(-0),
            { x: expect.closeTo(Date.now(), -2) as number, y: -0 },
          ],
          borderColor: '#FFA500',
          backgroundColor: '#FFA500',
          pointBackgroundColor: '#FFA500',
          pointRadius: 0,
          tension: 0.2,
          fill: true,
        },
      ],
    });

    spectator.setInput('stats', {
      isLoading: false,
      error: null,
      value: {
        blkio: {
          read: 1334567,
          write: 2445678,
        },
      },
    } as LoadingState<AppStats>);

    spectator.tick(1);

    const diskStats = spectator.component.diskStats();
    expect(diskStats[diskStats.length - 1]).toEqual([100000, 100000]);
  }));
});
