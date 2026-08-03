import { Location } from '@angular/common';
import { fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockApi, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { ProductType } from 'app/enums/product-type.enum';
import { AuthService } from 'app/modules/auth/auth.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { ShutdownComponent, blackoutDelay } from 'app/pages/system-tasks/shutdown/shutdown.component';
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

  // Rendered DOM instead of a CDK harness: ngOnInit schedules an in-zone 60s timer for the
  // blackout overlay, so the component only reaches zone stability long after the jest timeout.
  it('shows the shutdown message in the splash screen', () => {
    expect(spectator.query('ix-system-task-splash .message')).toHaveText('System is shutting down...');
  });

  it('keeps the screen readable until the system has had time to go down', () => {
    expect(spectator.query('.overlay')).not.toHaveClass('blackout');
  });

  // Component is re-created inside the fakeAsync zone: the blackout timer is only patched when
  // it is scheduled there.
  it('fades the screen to black once the system is off', fakeAsync(() => {
    spectator = createComponent();

    tick(blackoutDelay);
    spectator.detectChanges();

    expect(spectator.query('.overlay')).toHaveClass('blackout');
  }));
});
