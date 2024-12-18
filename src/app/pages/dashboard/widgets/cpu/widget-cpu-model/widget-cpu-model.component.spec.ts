import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { LoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetDatapointComponent } from 'app/pages/dashboard/widgets/common/widget-datapoint/widget-datapoint.component';
import { WidgetCpuModelComponent } from 'app/pages/dashboard/widgets/cpu/widget-cpu-model/widget-cpu-model.component';

describe('WidgetCpuModelComponent', () => {
  let spectator: Spectator<WidgetCpuModelComponent>;
  const createComponent = createComponentFactory({
    component: WidgetCpuModelComponent,
  });

  it('renders CPU Model for the remote system', () => {
    spectator = createComponent({
      props: {
        size: SlotSize.Full,
      },
      providers: [
        mockProvider(WidgetResourcesService, {
          cpuModel$: of({
            value: 'AMD EPYC 7313P 16-Core Processor',
            isLoading: false,
            error: null,
          } as LoadingState<string>),
        }),
      ],
    });

    const widget = spectator.query(WidgetDatapointComponent);
    expect(widget).toBeTruthy();
    expect(widget.text()).toBe('AMD EPYC 7313P 16-Core Processor');
  });

  it('shows an error when CPU Model cannot be determined', () => {
    spectator = createComponent({
      providers: [
        mockProvider(WidgetResourcesService, {
          cpuModel$: of({
            value: null,
            isLoading: false,
            error: new Error('Fatal error'),
          } as LoadingState<SystemInfo>),
        }),
      ],
    });

    expect(spectator.fixture.nativeElement).toHaveExactTrimmedText('Fatal error');
  });
});
