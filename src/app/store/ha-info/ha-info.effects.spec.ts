import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { firstValueFrom, ReplaySubject, of, throwError } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { CollectionChangeType } from 'app/enums/api.enum';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { HaStatus } from 'app/interfaces/events/ha-status-event.interface';
import { FailoverDisabledReasonEvent } from 'app/interfaces/failover-disabled-reasons.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { AppState } from 'app/store';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import {
  failoverLicensedStatusLoaded,
  haSettingsUpdated,
  haStatusLoaded,
} from 'app/store/ha-info/ha-info.actions';
import { HaInfoEffects } from 'app/store/ha-info/ha-info.effects';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { passiveNodeReplaced } from 'app/store/system-info/system-info.actions';

describe('HaInfoEffects', () => {
  let spectator: SpectatorService<HaInfoEffects>;
  let api: ApiService;
  let actions$: ReplaySubject<unknown>;
  let store$: MockStore<AppState>;

  const mockWindow = {
    localStorage: {
      getItem: jest.fn(),
      setItem: jest.fn(),
    },
  };

  const createService = createServiceFactory({
    service: HaInfoEffects,
    providers: [
      provideMockActions(() => actions$),
      provideMockStore({
        selectors: [
          { selector: selectIsHaLicensed, value: true },
        ],
      }),
      mockApi([
        mockCall('failover.licensed', true),
        mockCall('failover.disabled.reasons', []),
      ]),
      { provide: WINDOW, useValue: mockWindow },
    ],
  });

  beforeEach(() => {
    spectator = createService();
    api = spectator.inject(ApiService);
    store$ = spectator.inject(MockStore);
    actions$ = new ReplaySubject(1);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('loadFailoverLicensedStatus', () => {
    it('should load failover licensed status when adminUiInitialized', async () => {
      actions$.next(adminUiInitialized());

      const action = await firstValueFrom(spectator.service.loadFailoverLicensedStatus);
      expect(action).toEqual(failoverLicensedStatusLoaded({ isHaLicensed: true }));
      expect(api.call).toHaveBeenCalledWith('failover.licensed');
    });

    it('should handle API error when loading failover licensed status', () => {
      jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('API Error');
      jest.spyOn(api, 'call').mockReturnValue(throwError(() => error));

      actions$.next(adminUiInitialized());

      spectator.service.loadFailoverLicensedStatus.subscribe({
        error: (err: unknown) => {
          expect(err).toEqual(error);
        },
      });
    });
  });

  describe('loadHaStatus', () => {
    it('should load HA status when HA is licensed', async () => {
      const mockReasons: FailoverDisabledReason[] = [];
      jest.spyOn(api, 'call').mockReturnValue(of(mockReasons));

      actions$.next(failoverLicensedStatusLoaded({ isHaLicensed: true }));

      const action = await firstValueFrom(spectator.service.loadHaStatus);
      expect(action).toEqual(haStatusLoaded({
        haStatus: {
          hasHa: true,
          reasons: mockReasons,
        },
      }));
      expect(api.call).toHaveBeenCalledWith('failover.disabled.reasons');
      expect(mockWindow.localStorage.setItem).toHaveBeenCalledWith('ha_status', 'true');
    });

    it('should not load HA status when HA is not licensed', () => {
      store$.overrideSelector(selectIsHaLicensed, false);
      store$.refreshState();

      actions$.next(failoverLicensedStatusLoaded({ isHaLicensed: false }));

      let emitted = false;
      const subscription = spectator.service.loadHaStatus.subscribe(() => {
        emitted = true;
      });

      // Give it time to potentially emit
      expect(emitted).toBe(false);
      expect(api.call).not.toHaveBeenCalledWith('failover.disabled.reasons');
      subscription.unsubscribe();
    });

    it('should respond to haSettingsUpdated when HA is licensed', async () => {
      const mockReasons: FailoverDisabledReason[] = [FailoverDisabledReason.NoFailover];
      jest.spyOn(api, 'call').mockReturnValue(of(mockReasons));

      actions$.next(haSettingsUpdated());

      const action = await firstValueFrom(spectator.service.loadHaStatus);
      expect(action).toEqual(haStatusLoaded({
        haStatus: {
          hasHa: false,
          reasons: mockReasons,
        },
      }));
      expect(mockWindow.localStorage.setItem).toHaveBeenCalledWith('ha_status', 'false');
    });

    it('should respond to passiveNodeReplaced when HA is licensed', async () => {
      const mockReasons: FailoverDisabledReason[] = [];
      jest.spyOn(api, 'call').mockReturnValue(of(mockReasons));

      actions$.next(passiveNodeReplaced());

      const action = await firstValueFrom(spectator.service.loadHaStatus);
      expect(action).toEqual(haStatusLoaded({
        haStatus: {
          hasHa: true,
          reasons: mockReasons,
        },
      }));
    });
  });

  describe('subscribeToHa', () => {
    it('should subscribe to HA status updates when HA is licensed', async () => {
      const mockEvent: ApiEvent<FailoverDisabledReasonEvent> = {
        collection: 'failover.disabled.reasons',
        fields: {
          disabled_reasons: [FailoverDisabledReason.MismatchDisks],
        },
        id: 1,
        msg: CollectionChangeType.Changed,
      };
      jest.spyOn(api, 'subscribe').mockReturnValue(of(mockEvent));

      actions$.next(failoverLicensedStatusLoaded({ isHaLicensed: true }));

      const action = await firstValueFrom(spectator.service.subscribeToHa);
      expect(action).toEqual(haStatusLoaded({
        haStatus: {
          hasHa: false,
          reasons: mockEvent.fields.disabled_reasons,
        } as HaStatus,
      }));
      expect(api.subscribe).toHaveBeenCalledWith('failover.disabled.reasons');
      expect(mockWindow.localStorage.setItem).toHaveBeenCalledWith('ha_status', 'false');
    });

    it('should not subscribe to HA status when HA is not licensed', () => {
      actions$.next(failoverLicensedStatusLoaded({ isHaLicensed: false }));

      let emitted = false;
      const subscription = spectator.service.subscribeToHa.subscribe(() => {
        emitted = true;
      });

      // Give it time to potentially emit
      expect(emitted).toBe(false);
      expect(api.subscribe).not.toHaveBeenCalled();
      subscription.unsubscribe();
    });

    it('should handle empty reasons array in subscription', async () => {
      const mockEvent: ApiEvent<FailoverDisabledReasonEvent> = {
        collection: 'failover.disabled.reasons',
        fields: {
          disabled_reasons: [] as FailoverDisabledReason[],
        },
        id: 1,
        msg: CollectionChangeType.Changed,
      };
      jest.spyOn(api, 'subscribe').mockReturnValue(of(mockEvent));

      actions$.next(failoverLicensedStatusLoaded({ isHaLicensed: true }));

      const action = await firstValueFrom(spectator.service.subscribeToHa);
      expect(action).toEqual(haStatusLoaded({
        haStatus: {
          hasHa: true,
          reasons: [],
        } as HaStatus,
      }));
      expect(mockWindow.localStorage.setItem).toHaveBeenCalledWith('ha_status', 'true');
    });
  });
});
