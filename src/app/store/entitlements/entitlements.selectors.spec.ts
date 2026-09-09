import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { EntitlementReason } from 'app/enums/entitlement-reason.enum';
import { EntitlementEntry } from 'app/interfaces/entitlement.interface';
import { EntitlementsState } from 'app/store/entitlements/entitlements.reducer';
import { selectEntitlement, selectIsEntitled } from 'app/store/entitlements/entitlements.selectors';

const denied = {
  entitled: false,
  reason: EntitlementReason.WrongHardware,
  message: 'The KMIP key management feature is not available on this system\'s hardware.',
} as EntitlementEntry;

function stateWith(entitlements: EntitlementsState['entitlements']): { entitlements: EntitlementsState } {
  return { entitlements: { entitlements } };
}

describe('Entitlements Selectors', () => {
  describe('selectIsEntitled', () => {
    it('returns undefined while entitlements have not loaded, not false', () => {
      expect(selectIsEntitled(EntitlementFeature.Kmip)(stateWith(null))).toBeUndefined();
    });

    it('returns the decision when the feature is gated', () => {
      const state = stateWith({ [EntitlementFeature.Kmip]: denied });

      expect(selectIsEntitled(EntitlementFeature.Kmip)(state)).toBe(false);
    });

    it('treats a key absent from a loaded map as not gated', () => {
      expect(selectIsEntitled(EntitlementFeature.Kmip)(stateWith({}))).toBe(true);
    });
  });

  describe('selectEntitlement', () => {
    it('returns the entry so callers can explain a denial', () => {
      const state = stateWith({ [EntitlementFeature.Kmip]: denied });

      expect(selectEntitlement(EntitlementFeature.Kmip)(state)).toEqual(denied);
    });

    it('returns undefined for an ungated feature', () => {
      expect(selectEntitlement(EntitlementFeature.Kmip)(stateWith({}))).toBeUndefined();
    });
  });
});
