import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { firstValueFrom, ReplaySubject } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { SystemGeneralConfig } from 'app/interfaces/system-config.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import { systemConfigLoaded } from 'app/store/system-config/system-config.actions';
import { SystemConfigEffects } from 'app/store/system-config/system-config.effects';

describe('SystemConfigEffects', () => {
  let spectator: SpectatorService<SystemConfigEffects>;

  const generalConfig = {
    ui_certificate: {
      id: 1,
      name: 'truenas_default',
    },
  } as SystemGeneralConfig;
  const advancedConfig = {} as AdvancedConfig;

  const actions$ = new ReplaySubject(1);

  const createService = createServiceFactory({
    service: SystemConfigEffects,
    providers: [
      mockApi([
        mockCall('system.general.config', generalConfig),
        mockCall('system.advanced.config', advancedConfig),
        mockCall('system.general.ui_certificate_choices', { 1: 'truenas_default' }),
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

    it('normalizes numeric ui_certificate from backend into certificate object', async () => {
      const numericGeneralConfig = {
        ui_certificate: 1,
      } as unknown as SystemGeneralConfig;

      spectator.inject(MockApiService).mockCall('system.general.config', numericGeneralConfig);
      actions$.next(adminUiInitialized());

      const result = await firstValueFrom(spectator.service.loadConfig$);

      expect(result).toEqual(systemConfigLoaded({
        generalConfig: {
          ui_certificate: {
            id: 1,
            name: 'truenas_default',
          },
        } as SystemGeneralConfig,
        advancedConfig,
      }));
    });
  });
});
