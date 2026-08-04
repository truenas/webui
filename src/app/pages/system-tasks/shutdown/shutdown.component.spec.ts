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

  // Every test builds its component inside the fakeAsync zone rather than in a beforeEach:
  // ngOnInit schedules the 60s blackout timer, which is only patched - and so only tickable,
  // and only kept off the real clock - when it is scheduled there.
  it('shuts the system down with the reason from the query parameters', fakeAsync(() => {
    spectator = createComponent();

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('system.shutdown', ['User requested shutdown']);
  }));

  it('replaces location state to avoid shutting down again if user visits the page again', fakeAsync(() => {
    spectator = createComponent();

    expect(spectator.inject(Location).replaceState).toHaveBeenCalledWith('/signin');
  }));

  it('tears down the websocket connection once the shutdown job completes', fakeAsync(() => {
    spectator = createComponent();

    expect(spectator.inject(WebSocketHandlerService).prepareShutdown).toHaveBeenCalled();
    expect(spectator.inject(AuthService).clearAuthToken).toHaveBeenCalled();
  }));

  // Rendered DOM instead of a harness: awaiting one would block on the pending blackout timer.
  it('shows the shutdown message in the splash screen', fakeAsync(() => {
    spectator = createComponent();

    expect(spectator.query('ix-system-task-splash .message')).toHaveText('System is shutting down...');
  }));

  it('keeps the screen readable until the system has had time to go down', fakeAsync(() => {
    spectator = createComponent();

    expect(spectator.query('.overlay')).not.toHaveClass('blackout');
  }));

  it('fades the screen to black once the system is off', fakeAsync(() => {
    spectator = createComponent();

    tick(blackoutDelay);
    spectator.detectChanges();

    expect(spectator.query('.overlay')).toHaveClass('blackout');
  }));
});
