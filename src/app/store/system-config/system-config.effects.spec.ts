import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { firstValueFrom, ReplaySubject } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { SystemGeneralConfig } from 'app/interfaces/system-config.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { waitForConsent$ } from 'app/services/errors/wait-for-sentry-consent';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import { systemConfigLoaded } from 'app/store/system-config/system-config.actions';
import { SystemConfigEffects } from 'app/store/system-config/system-config.effects';

describe('SystemConfigEffects', () => {
  let spectator: SpectatorService<SystemConfigEffects>;

  const generalConfig = {} as SystemGeneralConfig;
  const advancedConfig = {} as AdvancedConfig;

  const actions$ = new ReplaySubject(1);

  const createService = createServiceFactory({
    service: SystemConfigEffects,
    providers: [
      mockApi([
        mockCall('system.general.config', generalConfig),
        mockCall('system.advanced.config', advancedConfig),
      ]),
      mockWindow({
        localStorage: {
          setItem: jest.fn(),
        },
      }),
      mockProvider(ErrorHandlerService),
      provideMockActions(actions$),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  describe('loadConfig$', () => {
    it('loads general and advanced config when adminUiInitialized is dispatched', () => {
      actions$.next(adminUiInitialized());

      spectator.service.loadConfig$.subscribe();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('system.general.config');
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('system.advanced.config');
    });

    it('dispatches systemConfigLoaded with loaded config', async () => {
      actions$.next(adminUiInitialized());

      const result = await firstValueFrom(spectator.service.loadConfig$);

      expect(result).toEqual(systemConfigLoaded({
        generalConfig,
        advancedConfig,
      }));
    });
  });

  describe('disableSentryIfNeeded$', () => {
    it('disables Sentry if usage_collection is false', () => {
      actions$.next(systemConfigLoaded({
        generalConfig: {
          usage_collection: false,
        } as SystemGeneralConfig,
        advancedConfig,
      }));

      spectator.service.disableSentryIfNeeded$.subscribe();

      expect(spectator.inject(ErrorHandlerService).disableSentry).toHaveBeenCalled();
    });

    it('emits usage_collection value to waitForConsent$', () => {
      jest.spyOn(waitForConsent$, 'next').mockImplementation();

      actions$.next(systemConfigLoaded({
        generalConfig: {
          usage_collection: false,
        } as SystemGeneralConfig,
        advancedConfig,
      }));

      spectator.service.disableSentryIfNeeded$.subscribe();

      expect(waitForConsent$.next).toHaveBeenCalledWith(false);
    });
  });
});
