import { Location } from '@angular/common';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TnIconComponent } from '@truenas/ui-components';
import { BehaviorSubject } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { ProductType } from 'app/enums/product-type.enum';
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
        isConnected$: new BehaviorSubject(false),
        setReconnectAllowed: jest.fn(),
        setFailoverStatus: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
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

  // Instance reads instead of TnCardHarness/TnIconHarness: the component re-arms an in-zone
  // setTimeout while the websocket is down, so it never reaches zone stability and any CDK
  // harness await here hangs until the jest timeout.
  it('shows the failover message and logo in a card', () => {
    expect(spectator.query('tn-card #message')).toHaveText('System is failing over...');

    const logo = spectator.query(TnIconComponent)!;
    expect(logo.name()).toBe('tn-truenas-logo');
    expect(logo.fullSize()).toBe(true);
  });
});
