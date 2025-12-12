import { fakeAsync } from '@angular/core/testing';
import { Spectator, mockProvider, createComponentFactory } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { LoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { AppStats } from 'app/interfaces/app.interface';
import { NetworkSpeedPipe } from 'app/modules/pipes/network-speed/network-speed.pipe';
import { ThemeService } from 'app/modules/theme/theme.service';
import { ByteChartComponent } from 'app/pages/dashboard/widgets/network/common/byte-chart/byte-chart.component';
import { AppNetworkInfoComponent } from './app-network-info.component';

describe('AppNetworkInfoComponent', () => {
  let spectator: Spectator<AppNetworkInfoComponent>;
  const createComponent = createComponentFactory({
    component: AppNetworkInfoComponent,
    imports: [NetworkSpeedPipe],
    declarations: [
      MockComponent(ByteChartComponent),
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
    expect(inOutRows[0]).toHaveText('In: 123 B/s');
    expect(inOutRows[1]).toHaveText('Out: 456 B/s');
  });

  it('should generate correct network chart data', () => {
    const chartData = spectator.component.networkStats();

    expect(chartData).toHaveLength(60);
    // Last point has the actual stats from the input
    expect(chartData[chartData.length - 1]).toEqual([123, 456]);
  });

  it('updates chart with actual network stats rates', fakeAsync(() => {
    spectator.tick(1);

    // First measurement adds actual rate to chart
    let networkStats = spectator.component.networkStats();
    expect(networkStats).toHaveLength(60);
    // Last point should have the actual rates (123 bytes/s for rx, 456 bytes/s for tx)
    expect(networkStats[networkStats.length - 1]).toEqual([123, 456]);

    // Second measurement adds new actual rates to chart
    spectator.setInput('stats', {
      isLoading: false,
      error: null,
      value: {
        networks: [{
          interface_name: 'eth0',
          rx_bytes: 223,
          tx_bytes: 556,
        }],
      },
    } as LoadingState<AppStats>);

    spectator.tick(1);

    networkStats = spectator.component.networkStats();
    // Last point should have the new actual rates (223 bytes/s for rx, 556 bytes/s for tx)
    expect(networkStats[networkStats.length - 1]).toEqual([223, 556]);
  }));
});
