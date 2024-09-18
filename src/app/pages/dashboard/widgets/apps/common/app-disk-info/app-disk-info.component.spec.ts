import { Spectator } from '@ngneat/spectator';
import { mockProvider, createComponentFactory } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { LoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { AppStats } from 'app/interfaces/app.interface';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { AppDiskInfoComponent } from 'app/pages/dashboard/widgets/apps/common/app-disk-info/app-disk-info.component';
import { NetworkChartComponent } from 'app/pages/dashboard/widgets/network/common/network-chart/network-chart.component';
import { ThemeService } from 'app/services/theme/theme.service';

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
    expect(title).toHaveText('Disk I/O');
  });

  it('checks read-write rows', () => {
    const readWriteRows = spectator.queryAll('.in-out-row');
    expect(readWriteRows[0]).toHaveText('Read: 1.18 MiB');
    expect(readWriteRows[1]).toHaveText('Write: 2.24 MiB');
  });

  it('should generate correct disk chart data', () => {
    const chartData = spectator.component.diskStats();

    expect(chartData).toHaveLength(60);
    expect(chartData[chartData.length - 1]).toEqual([1234567, 2345678]);
    expect(chartData[chartData.length - 2]).toEqual([0, 0]);
    expect(chartData[chartData.length - 3]).toEqual([0, 0]);
  });
});
