import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { ViewChartAreaComponent } from 'app/modules/charts/components/view-chart-area/view-chart-area.component';
import { NetworkChartComponent } from 'app/pages/dashboard/widgets/network/common/network-chart/network-chart.component';
import { LocaleService } from 'app/services/locale.service';

describe('NetworkChartComponent', () => {
  let spectator: Spectator<NetworkChartComponent>;
  const createComponent = createComponentFactory({
    component: NetworkChartComponent,
    declarations: [MockComponent(ViewChartAreaComponent)],
    providers: [
      mockProvider(LocaleService, {
        timeFormat: 'HH:mm',
        dateFormat: 'MM-DD',
      }),
    ],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows a chart with network traffic', () => {
    spectator.setInput('data', { datasets: [], labels: [] });
    spectator.detectChanges();

    const chart = spectator.query(ViewChartAreaComponent);
    expect(chart).toBeTruthy();

    const data = chart.data;
    expect(data).toMatchObject({
      datasets: [
        {
          pointBackgroundColor: 'blue',
          backgroundColor: 'blue',
          borderColor: 'blue',
          fill: true,
          label: 'Incoming [ens1]',
          pointRadius: 0,
          tension: 0.2,
          data: [
            { x: 1714583020000, y: 7728161.791999999 },
            { x: 1714583021000, y: 8728161.792000001 },
          ],
        },
        {
          pointBackgroundColor: 'orange',
          backgroundColor: 'orange',
          borderColor: 'orange',
          fill: true,
          label: 'Outgoing [ens1]',
          pointRadius: 0,
          tension: 0.2,
          data: [
            { x: 1714583020000, y: -992327.3728 },
            { x: 1714583021000, y: -1992327.3728 },
          ],
        },
      ],
    });
  });
});
