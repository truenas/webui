import { Location } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { ProductType } from 'app/enums/product-type.enum';
import { AuthService } from 'app/modules/auth/auth.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { RestartComponent } from 'app/pages/system-tasks/restart/restart.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';
import { selectIsHaEnabled, selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { selectIsEnterprise, selectProductType } from 'app/store/system-info/system-info.selectors';

describe('RestartComponent', () => {
  let spectator: Spectator<RestartComponent>;
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
      mockProvider(MatDialog, {
        closeAll: jest.fn(),
      }),
      mockProvider(ErrorHandlerService),
      mockProvider(WebSocketHandlerService, {
        prepareShutdown: jest.fn(),
        reconnect: jest.fn(),
      }),
      mockProvider(WebSocketStatusService, {
        setReconnectAllowed: jest.fn(),
      }),
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

  describe('without reason query parameter', () => {
    beforeEach(() => {
      spectator = createComponent();
    });

    it('calls system.reboot with default "Unknown Reason" when no reason is provided', () => {
      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('system.reboot', ['Unknown Reason']);
    });

    it('replaces URL state to prevent accidental restart on refresh', () => {
      expect(spectator.inject(Location).replaceState).toHaveBeenCalledWith('/signin');
    });

    it('closes all dialogs', () => {
      expect(spectator.inject(MatDialog).closeAll).toHaveBeenCalled();
    });
  });

  describe('with reason query parameter', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(ActivatedRoute, {
            snapshot: {
              queryParamMap: convertToParamMap({ reason: 'Active Controller Update Reboot' }),
            },
          }),
        ],
      });
    });

    it('calls system.reboot with the provided reason', () => {
      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith(
        'system.reboot',
        ['Active Controller Update Reboot'],
      );
    });
  });
});
