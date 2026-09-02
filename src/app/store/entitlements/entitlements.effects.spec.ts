import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { firstValueFrom, ReplaySubject, throwError } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { EntitlementReason } from 'app/enums/entitlement-reason.enum';
import { EntitlementsInfo } from 'app/interfaces/entitlement.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import { entitlementsLoaded, entitlementsLoadFailed } from 'app/store/entitlements/entitlements.actions';
import { EntitlementsEffects } from 'app/store/entitlements/entitlements.effects';
import { systemInfoUpdated } from 'app/store/system-info/system-info.actions';

const info = {
  features: {
    [EntitlementFeature.Kmip]: {
      entitled: false,
      reason: EntitlementReason.NoLicense,
      message: 'This system is not licensed to use the KMIP key management feature.',
    },
  },
} as EntitlementsInfo;

describe('EntitlementsEffects', () => {
  let spectator: SpectatorService<EntitlementsEffects>;
  let actions$: ReplaySubject<unknown>;

  const createService = createServiceFactory({
    service: EntitlementsEffects,
    providers: [
      mockApi([mockCall('truenas.entitlements.info', info)]),
      provideMockActions(() => actions$),
    ],
  });

  beforeEach(() => {
    actions$ = new ReplaySubject(1);
    spectator = createService();
  });

  it('loads entitlements when the admin UI initializes', async () => {
    actions$.next(adminUiInitialized());

    expect(await firstValueFrom(spectator.service.loadEntitlements))
      .toEqual(entitlementsLoaded({ entitlements: info.features }));
  });

  it('reloads when system info is updated, so a decision never outlives its license', async () => {
    actions$.next(systemInfoUpdated());

    expect(await firstValueFrom(spectator.service.loadEntitlements))
      .toEqual(entitlementsLoaded({ entitlements: info.features }));
  });

  it('reports failure instead of erroring, leaving the reducer to fall back permissively', async () => {
    jest.spyOn(spectator.inject(ApiService), 'call')
      .mockReturnValue(throwError(() => new Error('websocket down')));
    jest.spyOn(console, 'error').mockImplementation();
    actions$.next(adminUiInitialized());

    expect(await firstValueFrom(spectator.service.loadEntitlements)).toEqual(entitlementsLoadFailed());
  });
});
