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

    expect(chartComponent.data).toEqual({
      datasets: [
        {
          label: 'Read',
          data: [
            { x: 0, y: 0 },
            { x: 1000, y: 0 },
            { x: 2000, y: 0 },
            { x: 3000, y: 0 },
            { x: 4000, y: 0 },
            { x: 5000, y: 0 },
            { x: 6000, y: 0 },
            { x: 7000, y: 0 },
            { x: 8000, y: 0 },
            { x: 9000, y: 0 },
            { x: 10000, y: 0 },
            { x: 11000, y: 0 },
            { x: 12000, y: 0 },
            { x: 13000, y: 0 },
            { x: 14000, y: 0 },
            { x: 15000, y: 0 },
            { x: 16000, y: 0 },
            { x: 17000, y: 0 },
            { x: 18000, y: 0 },
            { x: 19000, y: 0 },
            { x: 20000, y: 0 },
            { x: 21000, y: 0 },
            { x: 22000, y: 0 },
            { x: 23000, y: 0 },
            { x: 24000, y: 0 },
            { x: 25000, y: 0 },
            { x: 26000, y: 0 },
            { x: 27000, y: 0 },
            { x: 28000, y: 0 },
            { x: 29000, y: 0 },
            { x: 30000, y: 0 },
            { x: 31000, y: 0 },
            { x: 32000, y: 0 },
            { x: 33000, y: 0 },
            { x: 34000, y: 0 },
            { x: 35000, y: 0 },
            { x: 36000, y: 0 },
            { x: 37000, y: 0 },
            { x: 38000, y: 0 },
            { x: 39000, y: 0 },
            { x: 40000, y: 0 },
            { x: 41000, y: 0 },
            { x: 42000, y: 0 },
            { x: 43000, y: 0 },
            { x: 44000, y: 0 },
            { x: 45000, y: 0 },
            { x: 46000, y: 0 },
            { x: 47000, y: 0 },
            { x: 48000, y: 0 },
            { x: 49000, y: 0 },
            { x: 50000, y: 0 },
            { x: 51000, y: 0 },
            { x: 52000, y: 0 },
            { x: 53000, y: 0 },
            { x: 54000, y: 0 },
            { x: 55000, y: 0 },
            { x: 56000, y: 0 },
            { x: 57000, y: 0 },
            { x: 58000, y: 0 },
            { x: 59000, y: 1234567 },
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
            { x: 0, y: -0 },
            { x: 1000, y: -0 },
            { x: 2000, y: -0 },
            { x: 3000, y: -0 },
            { x: 4000, y: -0 },
            { x: 5000, y: -0 },
            { x: 6000, y: -0 },
            { x: 7000, y: -0 },
            { x: 8000, y: -0 },
            { x: 9000, y: -0 },
            { x: 10000, y: -0 },
            { x: 11000, y: -0 },
            { x: 12000, y: -0 },
            { x: 13000, y: -0 },
            { x: 14000, y: -0 },
            { x: 15000, y: -0 },
            { x: 16000, y: -0 },
            { x: 17000, y: -0 },
            { x: 18000, y: -0 },
            { x: 19000, y: -0 },
            { x: 20000, y: -0 },
            { x: 21000, y: -0 },
            { x: 22000, y: -0 },
            { x: 23000, y: -0 },
            { x: 24000, y: -0 },
            { x: 25000, y: -0 },
            { x: 26000, y: -0 },
            { x: 27000, y: -0 },
            { x: 28000, y: -0 },
            { x: 29000, y: -0 },
            { x: 30000, y: -0 },
            { x: 31000, y: -0 },
            { x: 32000, y: -0 },
            { x: 33000, y: -0 },
            { x: 34000, y: -0 },
            { x: 35000, y: -0 },
            { x: 36000, y: -0 },
            { x: 37000, y: -0 },
            { x: 38000, y: -0 },
            { x: 39000, y: -0 },
            { x: 40000, y: -0 },
            { x: 41000, y: -0 },
            { x: 42000, y: -0 },
            { x: 43000, y: -0 },
            { x: 44000, y: -0 },
            { x: 45000, y: -0 },
            { x: 46000, y: -0 },
            { x: 47000, y: -0 },
            { x: 48000, y: -0 },
            { x: 49000, y: -0 },
            { x: 50000, y: -0 },
            { x: 51000, y: -0 },
            { x: 52000, y: -0 },
            { x: 53000, y: -0 },
            { x: 54000, y: -0 },
            { x: 55000, y: -0 },
            { x: 56000, y: -0 },
            { x: 57000, y: -0 },
            { x: 58000, y: -0 },
            { x: 59000, y: -2345678 },
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
