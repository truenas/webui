import { fakeAsync } from '@angular/core/testing';
import { Spectator } from '@ngneat/spectator';
import { mockProvider, createComponentFactory } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { LoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { AppStats } from 'app/interfaces/app.interface';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { ThemeService } from 'app/modules/theme/theme.service';
import { AppDiskInfoComponent } from 'app/pages/dashboard/widgets/apps/common/app-disk-info/app-disk-info.component';
import { NetworkChartComponent } from 'app/pages/dashboard/widgets/network/common/network-chart/network-chart.component';

describe('AppDiskInfoComponent', () => {
  let spectator: Spectator<AppDiskInfoComponent>;
  const createComponent = createComponentFactory({
    component: AppDiskInfoComponent,
    imports: [FileSizePipe],
    declarations: [
      MockComponent(NetworkChartComponent),
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

  it('checks network chart receives correct input', fakeAsync(() => {
    const chartComponent = spectator.query(NetworkChartComponent)!;
    expect(chartComponent).toBeTruthy();

    spectator.tick(1);

    const makeEmptyPoints = (y = 0): { x: number; y: number }[] => {
      return Array.from({ length: 59 }, (_, i) => ({
        x: expect.closeTo(Date.now() - (59 - i) * 1000, -2) as number,
        y,
      }));
    };

    expect(chartComponent.data).toEqual({
      datasets: [
        {
          label: 'Read',
          data: [
            ...makeEmptyPoints(),
            {
              x: expect.closeTo(Date.now(), -2) as number,
              y: 1234567,
            },
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
            {
              x: expect.closeTo(Date.now(), -2) as number,
              y: -2345678,
            },
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
  }));
});
