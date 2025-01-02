import { Spectator, mockProvider, createComponentFactory } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { LoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { AppStats } from 'app/interfaces/app.interface';
import { NetworkSpeedPipe } from 'app/modules/pipes/network-speed/network-speed.pipe';
import { ThemeService } from 'app/modules/theme/theme.service';
import { NetworkChartComponent } from 'app/pages/dashboard/widgets/network/common/network-chart/network-chart.component';
import { AppNetworkInfoComponent } from './app-network-info.component';

describe('AppNetworkInfoComponent', () => {
  let spectator: Spectator<AppNetworkInfoComponent>;
  const createComponent = createComponentFactory({
    component: AppNetworkInfoComponent,
    imports: [NetworkSpeedPipe],
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
            networks: [{
              interface_name: 'eth0',
              rx_bytes: 123,
              tx_bytes: 456,
            }],
          },
        } as LoadingState<AppStats>,
      },
    });
  });

  it('checks title', () => {
    const title = spectator.query('h4');
    expect(title).toHaveText('Network I/O');
  });

  it('checks in-out rows', () => {
    const inOutRows = spectator.queryAll('.in-out-row');
    expect(inOutRows[0]).toHaveText('In: 123 b/s');
    expect(inOutRows[1]).toHaveText('Out: 456 b/s');
  });

  it('should generate correct network chart data', () => {
    const chartData = spectator.component.networkStats();

    expect(chartData).toHaveLength(60);
    expect(chartData[chartData.length - 1]).toEqual([123, 456]);
    expect(chartData[chartData.length - 2]).toEqual([0, 0]);
    expect(chartData[chartData.length - 3]).toEqual([0, 0]);
  });
});
