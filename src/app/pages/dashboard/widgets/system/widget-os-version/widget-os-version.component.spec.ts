import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { LoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetDatapointComponent } from 'app/pages/dashboard/widgets/common/widget-datapoint/widget-datapoint.component';
import { WidgetOsVersionComponent } from 'app/pages/dashboard/widgets/system/widget-os-version/widget-os-version.component';

describe('WidgetOsVersionComponent', () => {
  let spectator: Spectator<WidgetOsVersionComponent>;
  const createComponent = createComponentFactory({
    component: WidgetOsVersionComponent,
  });

  it('renders OS Version for the current system', () => {
    spectator = createComponent({
      props: {
        size: SlotSize.Full,
      },
      providers: [
        mockProvider(WidgetResourcesService, {
          systemInfo$: of({
            value: {
              version: 'TrueNAS-SCALE-24.10.0-MASTER-20240518-113154',
            },
            isLoading: false,
            error: null,
          } as LoadingState<SystemInfo>),
        }),
      ],
    });

    const widget = spectator.query(WidgetDatapointComponent);
    expect(widget).toBeTruthy();
    expect(widget.text()).toBe('TrueNAS-SCALE-24.10.0-MASTER-20240518-113154');
    expect(widget.label()).toBe('OS Version');
  });

  it('shows an error when OS Version cannot be determined', () => {
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
