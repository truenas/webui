import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { BehaviorSubject, of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { ProductType } from 'app/enums/product-type.enum';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { ConfigResetComponent } from 'app/pages/system-tasks/config-reset/config-reset.component';
import { WebSocketStatusService } from 'app/services/websocket-status.service';
import { selectIsEnterprise, selectProductType } from 'app/store/system-info/system-info.selectors';

describe('ConfigResetComponent', () => {
  let spectator: Spectator<ConfigResetComponent>;
  let isConnected$: BehaviorSubject<boolean>;
  const createComponent = createComponentFactory({
    component: ConfigResetComponent,
    providers: [
      provideMockStore({
        selectors: [
          { selector: selectProductType, value: ProductType.CommunityEdition },
          { selector: selectIsEnterprise, value: false },
        ],
      }),
      mockApi([
        mockJob('config.reset', fakeSuccessfulJob()),
      ]),
      mockProvider(Location),
      mockProvider(WebSocketHandlerService, {
        prepareShutdown: jest.fn(),
        // The flag prepareShutdown() raises, which stays up until a new connection opens.
        isSystemShuttingDown: true,
      }),
      // AuthService is injected by SystemTaskRedirectService rather than by the component,
      // so it is easy to miss - mock it anyway to keep this spec off the real implementation.
      mockProvider(AuthService, {
        clearAuthToken: jest.fn(),
      }),
      mockProvider(DialogService, {
        closeAllDialogs: jest.fn(),
        jobDialog: jest.fn(() => ({
          afterClosed: () => of({}),
        })),
      }),
      mockProvider(Router),
    ],
  });

  /** Mirrors the reboot dropping the socket and WebSocketHandlerService opening a new one. */
  function simulateSystemComingBack(): void {
    isConnected$.next(false);
    Object.assign(spectator.inject(WebSocketHandlerService), { isSystemShuttingDown: false });
    isConnected$.next(true);
  }

  beforeEach(() => {
    // The connection is still live when config.reset returns - it only drops once the box
    // actually restarts. Created per test so no state is left behind by an earlier run.
    isConnected$ = new BehaviorSubject(true);
    spectator = createComponent({
      providers: [
        mockProvider(WebSocketStatusService, { isConnected$ }),
      ],
    });
  });

  it('closes on dialogs when user navigates to this page', () => {
    expect(spectator.inject(DialogService).closeAllDialogs).toHaveBeenCalled();
  });

  it('replaces location state to avoid resetting config again if user visits the page again', () => {
    expect(spectator.inject(Location).replaceState).toHaveBeenCalledWith('/signin');
  });

  it('resets config when user visits the page and waits for websocket to reconnect', () => {
    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('config.reset', [{ reboot: true }]);
    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(WebSocketHandlerService).prepareShutdown).toHaveBeenCalled();
  });

  it('takes user to sign-in page when new websocket connection is established after config reset', () => {
    expect(spectator.inject(Router).navigate).not.toHaveBeenCalled();

    simulateSystemComingBack();

    expect(spectator.inject(AuthService).clearAuthToken).toHaveBeenCalled();
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/signin']);
  });

  it('shows the config reset message in the splash screen', () => {
    expect(spectator.query('ix-system-task-splash .message')).toHaveText('Resetting configuration...');
    expect(spectator.query('ix-system-task-splash tn-icon.logo')).toExist();
  });
});
