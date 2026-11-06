import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { EntitlementEntry } from 'app/interfaces/entitlement.interface';
import { EntitlementsState } from 'app/store/entitlements/entitlements.reducer';

export const entitlementsStateKey = 'entitlements';

export const selectEntitlementsState = createFeatureSelector<EntitlementsState>(entitlementsStateKey);

export const selectEntitlements = createSelector(
  selectEntitlementsState,
  (state) => state?.entitlements ?? null,
);

/** Whether the map held is the failed-load assumption rather than middleware's answer. */
const selectEntitlementsAssumed = createSelector(
  selectEntitlementsState,
  (state) => state?.assumed ?? false,
);

/** Reach for this over `selectIsEntitled` only when a denial needs explaining. */
export const selectEntitlement = (
  feature: EntitlementFeature,
): MemoizedSelector<object, EntitlementEntry | undefined> => createSelector(
  selectEntitlements,
  (entitlements) => entitlements?.[feature],
);

/**
 * `undefined` means not loaded yet, not denied — collapsing it to `false` is what makes gated
 * controls flash hidden on boot and route guards deny during startup. A loaded map missing the
 * key resolves to `true`: middleware treats an absent identifier as not gated.
 */
export const selectIsEntitled = (
  feature: EntitlementFeature,
): MemoizedSelector<object, boolean | undefined> => createSelector(
  selectEntitlements,
  (entitlements) => {
    if (entitlements === null) {
      return undefined;
    }
    return entitlements[feature]?.entitled ?? true;
  },
);

/**
 * Like `selectIsEntitled`, but a loaded map missing the key reads as denied, not as not gated.
 * `undefined` still means not loaded.
 *
 * `selectIsEntitled` stays the default: gates on whole sections (Apps, VMs, Containers) must not
 * vanish on an older middleware or a failed load. Use this one only for features new enough that a
 * missing key means middleware cannot enforce them either, and where denial costs only a tag.
 */
export const selectIsEntitledStrictly = (
  feature: EntitlementFeature,
): MemoizedSelector<object, boolean | undefined> => createSelector(
  selectEntitlements,
  selectEntitlementsAssumed,
  (entitlements, assumed) => {
    if (entitlements === null) {
      return undefined;
    }
    const entry = entitlements[feature];
    if (entry) {
      return entry.entitled;
    }
    // A failed load reaches the same shape as an older middleware — a map without the key — for
    // the opposite reason, and denying on it would tag a licensed appliance Premium and drop its
    // audit settings from a create. An assumption is not an answer, so the gate stays unanswered.
    return assumed ? undefined : false;
  },
);
