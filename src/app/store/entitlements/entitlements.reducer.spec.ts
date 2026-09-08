import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { EntitlementReason } from 'app/enums/entitlement-reason.enum';
import { EntitlementEntry } from 'app/interfaces/entitlement.interface';
import { entitlementsLoaded, entitlementsLoadFailed } from 'app/store/entitlements/entitlements.actions';
import { entitlementsReducer, EntitlementsState } from 'app/store/entitlements/entitlements.reducer';

const denied = {
  entitled: false,
  reason: EntitlementReason.KeyMissing,
  message: 'nope',
} as EntitlementEntry;

describe('entitlementsReducer', () => {
  const unloaded: EntitlementsState = { entitlements: null };

  it('stores the loaded map', () => {
    const state = entitlementsReducer(
      unloaded,
      entitlementsLoaded({ entitlements: { [EntitlementFeature.Kmip]: denied } }),
    );

    expect(state.entitlements).toEqual({ [EntitlementFeature.Kmip]: denied });
  });

  it('falls back to a map that denies only SUPPORT when the first load fails', () => {
    const state = entitlementsReducer(unloaded, entitlementsLoadFailed());

    expect(Object.keys(state.entitlements)).toEqual([EntitlementFeature.Support]);
    expect(state.entitlements[EntitlementFeature.Support]).toMatchObject({
      entitled: false,
      reason: EntitlementReason.NoLicense,
    });
  });

  it('keeps the last known good map when a refresh fails', () => {
    const loaded = entitlementsReducer(
      unloaded,
      entitlementsLoaded({ entitlements: { [EntitlementFeature.Kmip]: denied } }),
    );

    const state = entitlementsReducer(loaded, entitlementsLoadFailed());

    expect(state.entitlements).toEqual({ [EntitlementFeature.Kmip]: denied });
  });
});
