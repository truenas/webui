import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { CallResponse } from '@truenas/api-client';
import { firstValueFrom, ReplaySubject } from 'rxjs';
import { MockTypedApiService } from 'app/core/testing/classes/mock-typed-api.service';
import { mockTypedApi, mockTypedCall } from 'app/core/testing/utils/mock-typed-api.utils';
import { HardwareType } from 'app/enums/hardware-type.enum';
import { LicenseFeature } from 'app/enums/license-feature.enum';
import { LicenseType } from 'app/enums/license-type.enum';
import { ContractType } from 'app/interfaces/system-info.interface';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import { entitlementFactsLoaded } from 'app/store/system-info/system-info.actions';
import { SystemInfoEffects } from 'app/store/system-info/system-info.effects';

type LicenseInfo = CallResponse<WebUiApiDirectory, 'truenas.license.info'>;

describe('SystemInfoEffects', () => {
  let spectator: SpectatorService<SystemInfoEffects>;
  let api: MockTypedApiService;
  let actions$: ReplaySubject<unknown>;

  const baseSystemInfo = { hostname: 'test-host', license: null } as CallResponse<WebUiApiDirectory, 'system.info'>;

  const baseLicense: LicenseInfo = {
    id: 'test-id',
    type: LicenseType.EnterpriseSingle,
    contract_type: ContractType.Gold,
    model: 'M40',
    features: [{
      name: LicenseFeature.Apps, start_date: null, expires_at: null, source: 'enterprise', type: null,
    }],
    serials: ['CI-1'],
    enclosures: {},
  };

  const createService = createServiceFactory({
    service: SystemInfoEffects,
    providers: [
      provideMockActions(() => actions$),
      provideMockStore(),
      mockTypedApi([
        mockTypedCall('system.info', baseSystemInfo),
        mockTypedCall('truenas.license.info', baseLicense),
        mockTypedCall('truenas.is_ix_hardware', true),
        mockTypedCall('truenas.entitlements.facts', {
          hardware_type: HardwareType.Truenas,
          license_type: LicenseType.EnterpriseSingle,
        }),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    api = spectator.inject(MockTypedApiService);
    actions$ = new ReplaySubject(1);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('loadSystemInfo', () => {
    it('merges truenas.license.info into systemInfo before dispatching', async () => {
      actions$.next(adminUiInitialized());

      const action = await firstValueFrom(spectator.service.loadSystemInfo);

      expect(api.call).toHaveBeenCalledWith('system.info');
      expect(api.call).toHaveBeenCalledWith('truenas.license.info');
      expect(action.systemInfo).toEqual({ ...baseSystemInfo, license: baseLicense });
    });

    it('emits systemInfoLoaded with license: null when truenas.license.info errors', async () => {
      jest.spyOn(console, 'error').mockImplementation();
      api.mockCallError('truenas.license.info');

      actions$.next(adminUiInitialized());
      const action = await firstValueFrom(spectator.service.loadSystemInfo);

      expect(action.systemInfo).toEqual({ ...baseSystemInfo, license: null });
    });

    it('uppercases lower-cased contract_type', async () => {
      api.mockCall('truenas.license.info', { ...baseLicense, contract_type: 'gold' });

      actions$.next(adminUiInitialized());
      const action = await firstValueFrom(spectator.service.loadSystemInfo);

      expect(action.systemInfo.license?.contract_type).toBe(ContractType.Gold);
    });

    it('preserves unknown contract_type values and warns', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      api.mockCall('truenas.license.info', { ...baseLicense, contract_type: 'platinum' });

      actions$.next(adminUiInitialized());
      const action = await firstValueFrom(spectator.service.loadSystemInfo);

      expect(action.systemInfo.license?.contract_type).toBe('PLATINUM');
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('platinum'));
    });
  });

  describe('loadEntitlementFacts', () => {
    it('loads truenas.entitlements.facts', async () => {
      actions$.next(adminUiInitialized());

      const action = await firstValueFrom(spectator.service.loadEntitlementFacts);

      expect(api.call).toHaveBeenCalledWith('truenas.entitlements.facts');
      expect(action).toEqual(entitlementFactsLoaded({
        entitlementFacts: { hardware_type: HardwareType.Truenas, license_type: LicenseType.EnterpriseSingle },
      }));
    });

    it('falls back to community hardware without a license when the call fails', async () => {
      jest.spyOn(console, 'error').mockImplementation();
      api.mockCallError('truenas.entitlements.facts');

      actions$.next(adminUiInitialized());
      const action = await firstValueFrom(spectator.service.loadEntitlementFacts);

      expect(action).toEqual(entitlementFactsLoaded({
        entitlementFacts: { hardware_type: HardwareType.Community, license_type: null },
      }));
    });
  });
});
