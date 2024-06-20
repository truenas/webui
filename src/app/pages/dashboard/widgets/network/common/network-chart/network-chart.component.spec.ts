import { fakeAsync } from '@angular/core/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ViewChartAreaComponent } from 'app/modules/charts/components/view-chart-area/view-chart-area.component';
import { WidgetNetworkComponent } from 'app/pages/dashboard-old/components/widget-network/widget-network.component';
import { LocaleService } from 'app/services/locale.service';

describe('NetworkChartComponent', () => {
  let spectator: Spectator<WidgetNetworkComponent>;
  const createComponent = createComponentFactory({
    component: WidgetNetworkComponent,
    imports: [NgxSkeletonLoaderModule],
    declarations: [
      MockComponent(ViewChartAreaComponent),
    ],
    providers: [
      mockProvider(LocaleService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {},
    });
  });

  it('shows a chart with network traffic', fakeAsync(() => {
    spectator.tick(1);
    const chart = spectator.query(ViewChartAreaComponent);
    expect(chart).not.toBeNull();

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
  }));
});
