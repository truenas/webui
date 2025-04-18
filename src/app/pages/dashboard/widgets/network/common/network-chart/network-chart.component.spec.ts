import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { ViewChartAreaComponent } from 'app/modules/charts/view-chart-area/view-chart-area.component';
import { LocaleService } from 'app/modules/language/locale.service';
import { NetworkChartComponent } from 'app/pages/dashboard/widgets/network/common/network-chart/network-chart.component';

// TODO: Update when fix is ready
// See https://github.com/help-me-mom/ng-mocks/issues/8634

@Component({
  selector: 'ix-view-chart-area-mock',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ViewChartAreaMockComponent {
  data = input();
  options = input();
}

describe('NetworkChartComponent', () => {
  let spectator: Spectator<NetworkChartComponent>;
  const createComponent = createComponentFactory({
    component: NetworkChartComponent,
    overrideComponents: [
      [NetworkChartComponent, {
        add: {
          imports: [ViewChartAreaMockComponent],
          template: '<ix-view-chart-area-mock [data]="data()" [options]="options()"></ix-view-chart-area-mock>',
        },
        remove: { imports: [ViewChartAreaComponent] },
      }],
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

    const chart = spectator.query(ViewChartAreaMockComponent)!;
    expect(chart).toBeTruthy();

    const data = chart.data();
    expect(data).toMatchObject({
      datasets: [],
      labels: [],
    });
  });
});
