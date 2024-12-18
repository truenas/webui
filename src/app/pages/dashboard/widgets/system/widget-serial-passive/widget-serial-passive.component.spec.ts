import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { LoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetDatapointComponent } from 'app/pages/dashboard/widgets/common/widget-datapoint/widget-datapoint.component';
import {
  WidgetSerialPassiveComponent,
} from 'app/pages/dashboard/widgets/system/widget-serial-passive/widget-serial-passive.component';

describe('WidgetSerialPassiveComponent', () => {
  let spectator: Spectator<WidgetSerialPassiveComponent>;
  const createComponent = createComponentFactory({
    component: WidgetSerialPassiveComponent,
  });

  it('renders serial for the remote system', () => {
    spectator = createComponent({
      props: {
        size: SlotSize.Full,
      },
      providers: [
        mockProvider(WidgetResourcesService, {
          systemInfo$: of({
            value: {
              remote_info: {
                system_serial: '123456',
              },
            },
            isLoading: false,
            error: null,
          } as LoadingState<SystemInfo>),
        }),
      ],
    });

    const widget = spectator.query(WidgetDatapointComponent);
    expect(widget).toBeTruthy();
    expect(widget.text()).toBe('123456');
  });

  it('shows an error when serial cannot be determined', () => {
    spectator = createComponent({
      providers: [
        mockProvider(WidgetResourcesService, {
          systemInfo$: of({
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
