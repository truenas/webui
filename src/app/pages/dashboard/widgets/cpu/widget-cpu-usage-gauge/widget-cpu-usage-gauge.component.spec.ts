import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { CpuChartGaugeComponent } from 'app/pages/dashboard/widgets/cpu/common/cpu-chart-gauge/cpu-chart-gauge.component';
import { WidgetCpuUsageGaugeComponent } from 'app/pages/dashboard/widgets/cpu/widget-cpu-usage-gauge/widget-cpu-usage-gauge.component';

describe('WidgetCpuUsageGaugeComponent', () => {
  let spectator: Spectator<WidgetCpuUsageGaugeComponent>;
  const createComponent = createComponentFactory({
    component: WidgetCpuUsageGaugeComponent,
    imports: [
      NgxSkeletonLoaderComponent,
      MockComponent(CpuChartGaugeComponent),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        size: SlotSize.Quarter,
      },
    });
  });

  it('shows cpu chart gauge', () => {
    const chart = spectator.query(CpuChartGaugeComponent);
    expect(chart).not.toBeNull();
  });
});
