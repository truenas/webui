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

    // First measurement only sets baseline, doesn't add to chart
    let diskStats = spectator.component.diskStats();
    expect(diskStats).toHaveLength(60);
    // All values are still 0 from initialization
    expect(diskStats.every((point) => point[0] === 0 && point[1] === 0)).toBe(true);

    // Second measurement calculates delta and adds to chart
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

    diskStats = spectator.component.diskStats();
    // Last point should have the delta (100000 bytes for both read and write)
    expect(diskStats[diskStats.length - 1]).toEqual([100000, 100000]);
  }));
});
