import { Location } from '@angular/common';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { BehaviorSubject } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { ProductType } from 'app/enums/product-type.enum';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { FailoverComponent } from 'app/pages/system-tasks/failover/failover.component';
import { WebSocketStatusService } from 'app/services/websocket-status.service';
import { selectIsEnterprise, selectProductType } from 'app/store/system-info/system-info.selectors';

describe('FailoverComponent', () => {
  let spectator: Spectator<FailoverComponent>;
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
    spectator = createComponent();
  });

  it('makes the active controller become passive', () => {
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('failover.become_passive');
  });

  it('replaces location state to avoid failing over again if user visits the page again', () => {
    expect(spectator.inject(Location).replaceState).toHaveBeenCalledWith('/signin');
  });

  it('shows the failover message and logo in a card', () => {
    expect(spectator.query('tn-card')).toExist();
    expect(spectator.query('tn-card #message')).toHaveText('System is failing over...');
    expect(spectator.query('tn-card tn-icon')).toExist();
  });
});
