import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { CallResponse } from '@truenas/api-client';
import { firstValueFrom, ReplaySubject } from 'rxjs';
import { mockTypedApi, mockTypedCall } from 'app/core/testing/utils/mock-typed-api.utils';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import { systemConfigLoaded } from 'app/store/system-config/system-config.actions';
import { SystemConfigEffects } from 'app/store/system-config/system-config.effects';

describe('SystemConfigEffects', () => {
  let spectator: SpectatorService<SystemConfigEffects>;

  const generalConfig = {} as CallResponse<WebUiApiDirectory, 'system.general.config'>;
  const advancedConfig = {} as CallResponse<WebUiApiDirectory, 'system.advanced.config'>;

  const actions$ = new ReplaySubject(1);

  const createService = createServiceFactory({
    service: SystemConfigEffects,
    providers: [
      mockTypedApi([
        mockTypedCall('system.general.config', generalConfig),
        mockTypedCall('system.advanced.config', advancedConfig),
      ]),
      mockWindow({
        localStorage: {
          setItem: jest.fn(),
        },
      }),
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

      expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith('system.general.config');
      expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith('system.advanced.config');
    });

    it('dispatches systemConfigLoaded with loaded config', async () => {
      actions$.next(adminUiInitialized());

      const result = await firstValueFrom(spectator.service.loadConfig$);

      expect(result).toEqual(systemConfigLoaded({
        generalConfig,
        advancedConfig: advancedConfig as AdvancedConfig,
      }));
    });
  });
});
