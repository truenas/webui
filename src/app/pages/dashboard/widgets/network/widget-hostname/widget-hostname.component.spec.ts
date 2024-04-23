import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { LoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetDatapointComponent } from 'app/pages/dashboard/widgets/common/widget-datapoint/widget-datapoint.component';
import { WidgetHostnameComponent } from 'app/pages/dashboard/widgets/network/widget-hostname/widget-hostname.component';

describe('WidgetHostnameComponent', () => {
  let spectator: Spectator<WidgetHostnameComponent>;
  const createComponent = createComponentFactory({
    component: WidgetHostnameComponent,
    declarations: [
      MockComponent(WidgetDatapointComponent),
    ],
  });

  it('renders hostname for the current system', () => {
    spectator = createComponent({
      props: {
        size: SlotSize.Full,
      },
      providers: [
        mockProvider(WidgetResourcesService, {
          systemInfo$: of({
            value: {
              hostname: 'truenas.com',
            },
            isLoading: false,
            error: null,
          } as LoadingState<SystemInfo>),
        }),
      ],
    });

    const widget = spectator.query(MockComponent(WidgetDatapointComponent));
    expect(widget).toBeTruthy();
    expect(widget.text).toBe('truenas.com');
  });

  it('shows an error when hostname cannot be determined', () => {
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

    expect(spectator.fixture.nativeElement).toHaveExactTrimmedText('Error');
  });
});
