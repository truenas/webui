import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { EntitlementReason } from 'app/enums/entitlement-reason.enum';
import { EntitlementEntry } from 'app/interfaces/entitlement.interface';
import { EntitlementsState } from 'app/store/entitlements/entitlements.reducer';
import {
  selectEntitlement, selectIsEntitled, selectIsEntitledStrictly,
} from 'app/store/entitlements/entitlements.selectors';

const denied = {
  entitled: false,
  reason: EntitlementReason.WrongHardware,
  message: 'The KMIP key management feature is not available on this system\'s hardware.',
} as EntitlementEntry;

function stateWith(
  entitlements: EntitlementsState['entitlements'],
  assumed = false,
): { entitlements: EntitlementsState } {
  return { entitlements: { entitlements, assumed } };
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

  describe('selectIsEntitledStrictly', () => {
    it('returns undefined while entitlements have not loaded, not false', () => {
      expect(selectIsEntitledStrictly(EntitlementFeature.Kmip)(stateWith(null))).toBeUndefined();
    });

    it('returns the decision when the feature is gated', () => {
      const state = stateWith({ [EntitlementFeature.Kmip]: denied });

      expect(selectIsEntitledStrictly(EntitlementFeature.Kmip)(state)).toBe(false);
    });

    it('treats a key absent from a loaded map as denied, unlike selectIsEntitled', () => {
      // A middleware whose POLICY does not carry the key cannot enforce the feature either, so
      // the UI offering it unlocked would be the wrong half of the guess.
      expect(selectIsEntitledStrictly(EntitlementFeature.Kmip)(stateWith({}))).toBe(false);
      expect(selectIsEntitled(EntitlementFeature.Kmip)(stateWith({}))).toBe(true);
    });

    it('stays unanswered for a key absent from the failed-load assumption', () => {
      // A failed load leaves a permissive map behind, the same shape as an older middleware for
      // the opposite reason. Denying on it would tag a licensed appliance Premium.
      expect(selectIsEntitledStrictly(EntitlementFeature.Kmip)(stateWith({}, true))).toBeUndefined();
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
