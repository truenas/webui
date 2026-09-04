import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { firstValueFrom, take, toArray } from 'rxjs';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { EntitlementReason } from 'app/enums/entitlement-reason.enum';
import { EntitlementEntry } from 'app/interfaces/entitlement.interface';
import { EntitlementsService } from 'app/services/entitlements.service';
import { entitlementsStateKey } from 'app/store/entitlements/entitlements.selectors';

const denied = {
  entitled: false,
  reason: EntitlementReason.KeyMissing,
  message: "This system's license does not include the KMIP key management feature.",
} as EntitlementEntry;

describe('EntitlementsService', () => {
  let spectator: SpectatorService<EntitlementsService>;
  let store$: MockStore;

  const createService = createServiceFactory({
    service: EntitlementsService,
    providers: [
      provideMockStore({ initialState: { [entitlementsStateKey]: { entitlements: null } } }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    store$ = spectator.inject(MockStore);
  });

  function loadWith(entitlements: Record<string, EntitlementEntry>): void {
    store$.setState({ [entitlementsStateKey]: { entitlements } });
    store$.refreshState();
  }

  describe('entitled$', () => {
    it('does not emit until entitlements have loaded', () => {
      const emitted: boolean[] = [];
      spectator.service.entitled$(EntitlementFeature.Kmip).subscribe((value) => emitted.push(value));

      expect(emitted).toEqual([]);
    });

    it('emits the decision once loaded, never a transient false first', async () => {
      const emissions = firstValueFrom(
        spectator.service.entitled$(EntitlementFeature.Kmip).pipe(take(1), toArray()),
      );
      loadWith({ [EntitlementFeature.Kmip]: denied });

      expect(await emissions).toEqual([false]);
    });

    it('emits true for a feature absent from a loaded map', async () => {
      loadWith({});

      expect(await firstValueFrom(spectator.service.entitled$(EntitlementFeature.Kmip))).toBe(true);
    });
  });

  describe('entitled', () => {
    it('reads undefined while loading and the decision afterwards', () => {
      const entitled = spectator.service.entitled(EntitlementFeature.Kmip);
      expect(entitled()).toBeUndefined();

      loadWith({ [EntitlementFeature.Kmip]: denied });

      expect(entitled()).toBe(false);
    });
  });

  describe('entitlement', () => {
    it('exposes the reason and message so a caller can explain a denial', () => {
      loadWith({ [EntitlementFeature.Kmip]: denied });

      expect(spectator.service.entitlement(EntitlementFeature.Kmip)()).toEqual(denied);
    });
  });

  it('caches instances per feature so memoization is not defeated per call site', () => {
    expect(spectator.service.entitled(EntitlementFeature.Kmip))
      .toBe(spectator.service.entitled(EntitlementFeature.Kmip));
    expect(spectator.service.entitlement(EntitlementFeature.Vms))
      .toBe(spectator.service.entitlement(EntitlementFeature.Vms));
  });
});
