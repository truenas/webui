import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { CpuCoreBarComponent } from 'app/pages/dashboard/widgets/cpu/common/cpu-core-bar/cpu-core-bar.component';
import { WidgetCpuTemperatureBarComponent } from 'app/pages/dashboard/widgets/cpu/widget-cpu-temperature-bar/widget-cpu-temperature-bar.component';

describe('WidgetCpuTemperatureBarComponent', () => {
  let spectator: Spectator<WidgetCpuTemperatureBarComponent>;
  const createComponent = createComponentFactory({
    component: WidgetCpuTemperatureBarComponent,
    declarations: [
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
    expect(spectator.query('h3')).toHaveText('CPU Temperature Per Core');
  });

  it('shows cpu core bar without usage', () => {
    const bar = spectator.query(CpuCoreBarComponent);
    expect(bar).not.toBeNull();
    expect(bar.hideUsage).toBe(true);
  });
});
