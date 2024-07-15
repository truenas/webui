import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { ViewChartAreaComponent } from 'app/modules/charts/components/view-chart-area/view-chart-area.component';
import { NetworkChartComponent } from 'app/pages/dashboard/widgets/network/common/network-chart/network-chart.component';
import { LocaleService } from 'app/services/locale.service';

// TODO: Update when fix is ready
// See https://github.com/help-me-mom/ng-mocks/issues/8634

describe('NetworkChartComponent', () => {
  let spectator: Spectator<NetworkChartComponent>;
  const createComponent = createComponentFactory({
    component: NetworkChartComponent,
    declarations: [
      MockComponent(ViewChartAreaComponent),
    ],
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
      datasets: [],
      labels: [],
    });
  });
});
