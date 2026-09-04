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
