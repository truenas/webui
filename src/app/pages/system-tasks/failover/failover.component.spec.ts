import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { BehaviorSubject } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { ProductType } from 'app/enums/product-type.enum';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { FailoverComponent } from 'app/pages/system-tasks/failover/failover.component';
import { WebSocketStatusService } from 'app/services/websocket-status.service';
import { passiveNodeReplaced } from 'app/store/system-info/system-info.actions';
import { selectIsEnterprise, selectProductType } from 'app/store/system-info/system-info.selectors';

describe('FailoverComponent', () => {
  let spectator: Spectator<FailoverComponent>;
  let dispatchSpy: jest.SpyInstance;
  const isConnected$ = new BehaviorSubject(false);
  const createComponent = createComponentFactory({
    component: FailoverComponent,
    providers: [
      provideMockStore({
        selectors: [
          { selector: selectProductType, value: ProductType.CommunityEdition },
          { selector: selectIsEnterprise, value: false },
        ],
      }),
      mockApi([
        mockCall('failover.become_passive'),
      ]),
      mockProvider(Location),
      mockProvider(LoaderService),
      mockProvider(DialogService, {
        closeAllDialogs: jest.fn(),
      }),
      mockProvider(WebSocketHandlerService, {
        prepareShutdown: jest.fn(),
      }),
      mockProvider(WebSocketStatusService, {
        isConnected$,
        setReconnectAllowed: jest.fn(),
        setFailoverStatus: jest.fn(),
      }),
      mockProvider(AuthService, {
        clearAuthToken: jest.fn(),
      }),
      mockProvider(Router),
    ],
  });

  beforeEach(() => {
    // The subject is shared across tests, so put the connection back down before each run -
    // the component waits for the websocket to drop before watching for it to come back.
    isConnected$.next(false);
    // ngOnInit dispatches on the store, so the spy has to be in place before it runs.
    spectator = createComponent({ detectChanges: false });
    dispatchSpy = jest.spyOn(spectator.inject(MockStore), 'dispatch');
    spectator.detectChanges();
  });

  it('makes the active controller become passive', () => {
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('failover.become_passive');
  });

  it('replaces location state to avoid failing over again if user visits the page again', () => {
    expect(spectator.inject(Location).replaceState).toHaveBeenCalledWith('/signin');
  });

  it('puts the websocket into failover mode and closes any open dialogs', () => {
    expect(spectator.inject(WebSocketStatusService).setReconnectAllowed).toHaveBeenCalledWith(false);
    expect(spectator.inject(WebSocketStatusService).setFailoverStatus).toHaveBeenCalledWith(true);
    expect(spectator.inject(DialogService).closeAllDialogs).toHaveBeenCalled();
  });

  it('marks the passive node as replaced and tears down the connection once failover completes', () => {
    expect(dispatchSpy).toHaveBeenCalledWith(passiveNodeReplaced());
    expect(spectator.inject(WebSocketHandlerService).prepareShutdown).toHaveBeenCalled();
  });

  it('takes user to sign-in page once the websocket comes back after the failover', () => {
    expect(spectator.inject(Router).navigate).not.toHaveBeenCalled();

    isConnected$.next(true);

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/signin']);
  });

  it('shows the failover message in the splash screen', () => {
    expect(spectator.query('ix-system-task-splash #message')).toHaveText('System is failing over...');
  });
});
