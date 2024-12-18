import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { CpuCoreBarComponent } from 'app/pages/dashboard/widgets/cpu/common/cpu-core-bar/cpu-core-bar.component';
import { WidgetCpuUsageBarComponent } from 'app/pages/dashboard/widgets/cpu/widget-cpu-usage-bar/widget-cpu-usage-bar.component';

describe('WidgetCpuUsageBarComponent', () => {
  let spectator: Spectator<WidgetCpuUsageBarComponent>;
  const createComponent = createComponentFactory({
    component: WidgetCpuUsageBarComponent,
    imports: [
      NgxSkeletonLoaderComponent,
      MockComponent(CpuCoreBarComponent),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        size: SlotSize.Half,
      },
    });
  });

  it('shows title', () => {
    expect(spectator.query('h3')).toHaveText('CPU Usage Per Core');
  });

  it('shows cpu core bar without temperature', () => {
    const bar = spectator.query(CpuCoreBarComponent);
    expect(bar).not.toBeNull();
    expect(bar.hideTemperature).toBe(true);
  });
});
