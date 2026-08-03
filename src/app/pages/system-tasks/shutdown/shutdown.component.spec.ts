import { Location } from '@angular/common';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnCardComponent, TnIconComponent } from '@truenas/ui-components';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockApi, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { ProductType } from 'app/enums/product-type.enum';
import { AuthService } from 'app/modules/auth/auth.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { ShutdownComponent } from 'app/pages/system-tasks/shutdown/shutdown.component';
import { selectIsEnterprise, selectProductType } from 'app/store/system-info/system-info.selectors';

describe('ShutdownComponent', () => {
  let spectator: Spectator<ShutdownComponent>;
  const createComponent = createComponentFactory({
    component: ShutdownComponent,
    providers: [
      provideMockStore({
        selectors: [
          { selector: selectProductType, value: ProductType.CommunityEdition },
          { selector: selectIsEnterprise, value: false },
        ],
      }),
      mockApi([
        mockJob('system.shutdown', fakeSuccessfulJob()),
      ]),
      mockProvider(Location),
      mockProvider(WebSocketHandlerService, {
        prepareShutdown: jest.fn(),
      }),
      mockProvider(AuthService, {
        clearAuthToken: jest.fn(),
      }),
      mockProvider(ActivatedRoute, {
        snapshot: {
          queryParamMap: convertToParamMap({ reason: 'User requested shutdown' }),
        },
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shuts the system down with the reason from the query parameters', () => {
    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('system.shutdown', ['User requested shutdown']);
  });

  it('replaces location state to avoid shutting down again if user visits the page again', () => {
    expect(spectator.inject(Location).replaceState).toHaveBeenCalledWith('/signin');
  });

  it('tears down the websocket connection once the shutdown job completes', () => {
    expect(spectator.inject(WebSocketHandlerService).prepareShutdown).toHaveBeenCalled();
    expect(spectator.inject(AuthService).clearAuthToken).toHaveBeenCalled();
  });

  // Instance reads instead of TnCardHarness/TnIconHarness: ngOnInit schedules an in-zone
  // setTimeout for the blackout overlay that outlives the jest timeout, so the component
  // never reaches zone stability and any CDK harness await here hangs for 30s.
  it('shows the shutdown message and logo in a card', () => {
    const card = spectator.query(TnCardComponent)!;
    expect(card.elevation()).toBe('low');
    expect(card.padding()).toBe('small');

    expect(spectator.query('#shutdown-message')).toHaveText('System is shutting down...');

    const logo = spectator.query(TnIconComponent)!;
    expect(logo.name()).toBe('tn-truenas-logo');
    expect(logo.fullSize()).toBe(true);
  });
});
