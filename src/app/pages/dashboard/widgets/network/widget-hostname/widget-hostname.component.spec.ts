import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { LoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetHostnameComponent } from 'app/pages/dashboard/widgets/network/widget-hostname/widget-hostname.component';

describe('WidgetHostnameComponent', () => {
  let spectator: Spectator<WidgetHostnameComponent>;
  const createComponent = createComponentFactory({
    component: WidgetHostnameComponent,
  });

  it('renders hostname for the current system', () => {
    spectator = createComponent({
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

    expect(spectator.fixture.nativeElement).toHaveExactTrimmedText('truenas.com');
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
