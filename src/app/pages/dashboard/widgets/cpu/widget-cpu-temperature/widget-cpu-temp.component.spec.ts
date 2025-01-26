import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetDatapointComponent } from 'app/pages/dashboard/widgets/common/widget-datapoint/widget-datapoint.component';
import { WidgetCpuTempComponent } from 'app/pages/dashboard/widgets/cpu/widget-cpu-temperature/widget-cpu-temp.component';

describe('WidgetCpuTempComponent', () => {
  let spectator: Spectator<WidgetCpuTempComponent>;
  const createComponent = createComponentFactory({
    component: WidgetCpuTempComponent,
  });

  it('renders CPU Temp for the remote system', () => {
    spectator = createComponent({
      props: {
        size: SlotSize.Full,
      },
      providers: [
        mockProvider(WidgetResourcesService, {
          realtimeUpdates$: of({
            fields: {
              cpu: {
                cpu: { temp: 10 },
              },
            },
          }),
        }),
      ],
    });

    const widget = spectator.query(WidgetDatapointComponent)!;
    expect(widget).toBeTruthy();
    expect(widget.text()).toBe('10 °C');
  });

  it('shows an error when CPU Temp cannot be determined', () => {
    spectator = createComponent({
      props: {
        size: SlotSize.Full,
      },
      providers: [
        mockProvider(WidgetResourcesService, {
          realtimeUpdates$: of({
            fields: {
              cpu: {
                cpu: { temp: undefined },
              },
            },
          }),
        }),
      ],
    });

    const widget = spectator.query(WidgetDatapointComponent)!;
    expect(widget).toBeTruthy();
    expect(widget.text()).toBe('N/A');
  });
});
