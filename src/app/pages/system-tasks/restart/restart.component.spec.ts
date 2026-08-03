import { Location } from '@angular/common';
import { Provider } from '@angular/core';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { BehaviorSubject } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { ProductType } from 'app/enums/product-type.enum';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { RestartComponent } from 'app/pages/system-tasks/restart/restart.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';
import { selectIsHaEnabled, selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { selectIsEnterprise, selectProductType } from 'app/store/system-info/system-info.selectors';

describe('RestartComponent', () => {
  let spectator: Spectator<RestartComponent>;
  let isConnected$: BehaviorSubject<boolean>;
  const createComponent = createComponentFactory({
    component: RestartComponent,
    providers: [
      provideMockStore({
        selectors: [
          { selector: selectIsHaLicensed, value: false },
          { selector: selectIsHaEnabled, value: false },
          { selector: selectProductType, value: ProductType.CommunityEdition },
          { selector: selectIsEnterprise, value: false },
        ],
      }),
      mockApi([
        mockJob('system.reboot', fakeSuccessfulJob()),
      ]),
      mockProvider(Router),
      mockProvider(Location, {
        replaceState: jest.fn(),
      }),
      mockProvider(DialogService, {
        closeAllDialogs: jest.fn(),
      }),
      mockProvider(ErrorHandlerService),
      mockProvider(WebSocketHandlerService, {
        prepareShutdown: jest.fn(),
        reconnect: jest.fn(),
        // The flag prepareShutdown() raises, which stays up until a new connection opens.
        isSystemShuttingDown: true,
      }),
      // AuthService is injected by SystemTaskRedirectService rather than by the component,
      // so it is easy to miss - mock it anyway to keep this spec off the real implementation.
      mockProvider(AuthService, {
        clearAuthToken: jest.fn(),
      }),
      mockProvider(ActivatedRoute, {
        snapshot: {
          queryParamMap: convertToParamMap({}),
        },
      }),
    ],
  });

  /**
   * The connection is still live when system.reboot returns - it only drops once the box
   * actually restarts. Created per test so no state is left behind by an earlier run.
   */
  function createRestart(providers: Provider[] = []): void {
    isConnected$ = new BehaviorSubject(true);
    spectator = createComponent({
      providers: [
        mockProvider(WebSocketStatusService, {
          isConnected$,
          setReconnectAllowed: jest.fn(),
        }),
        ...providers,
      ],
    });
  }

  describe('without reason query parameter', () => {
    beforeEach(() => {
      createRestart();
    });

    it('calls system.reboot with default "Unknown Reason" when no reason is provided', () => {
      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('system.reboot', ['Unknown Reason']);
    });

    it('replaces URL state to prevent accidental restart on refresh', () => {
      expect(spectator.inject(Location).replaceState).toHaveBeenCalledWith('/signin');
    });

    it('closes all dialogs', () => {
      expect(spectator.inject(DialogService).closeAllDialogs).toHaveBeenCalled();
    });

    // Rendered DOM instead of a harness: there is no TnCardHarness in @truenas/ui-components.
    it('shows the restarting message in the splash screen', () => {
      expect(spectator.query('ix-system-task-splash .message')).toHaveText('System is restarting...');
    });

    // Not reconnect(): forcing the socket down would start the handler's retry loop while
    // middleware is still up, and a successful early retry would read as a finished reboot.
    it('marks the connection as shutting down once the reboot job returns', () => {
      expect(spectator.inject(WebSocketHandlerService).prepareShutdown).toHaveBeenCalled();
      expect(spectator.inject(WebSocketHandlerService).reconnect).not.toHaveBeenCalled();
    });

    it('stays on the splash screen until the websocket comes back after the reboot', () => {
      expect(spectator.inject(Router).navigate).not.toHaveBeenCalled();

      // Mirrors the reboot dropping the socket and the handler opening a new connection.
      isConnected$.next(false);
      Object.assign(spectator.inject(WebSocketHandlerService), { isSystemShuttingDown: false });
      isConnected$.next(true);

      expect(spectator.inject(AuthService).clearAuthToken).toHaveBeenCalled();
      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/signin']);
    });
  });

  describe('with reason query parameter', () => {
    beforeEach(() => {
      createRestart([
        mockProvider(ActivatedRoute, {
          snapshot: {
            queryParamMap: convertToParamMap({ reason: 'Active Controller Update Reboot' }),
          },
        }),
      ]);
    });

    it('calls system.reboot with the provided reason', () => {
      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith(
        'system.reboot',
        ['Active Controller Update Reboot'],
      );
    });
  });
});
