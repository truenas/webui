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

/**
 * The same decision for a feature the UI will not offer without an affirmative grant: a loaded
 * map missing the key reads as denied rather than as not gated. `undefined` still means not
 * loaded — nothing is decided before the answer arrives.
 *
 * `selectIsEntitled` stays the default and the general rule, because it is middleware's: `check`
 * answers NOT_GATED for a key `POLICY` does not carry, and most gates here guard whole navigation
 * sections (Apps, VMs, Containers) that must not vanish because a middleware is older than a key,
 * or because the map failed to load.
 *
 * Reach for this one where showing the feature unlocked is the worse half of that guess: it is
 * new enough that a map without its key means a middleware that cannot enforce it either, and the
 * denied treatment costs nothing but a tag.
 */
export const selectIsEntitledStrictly = (
  feature: EntitlementFeature,
): MemoizedSelector<object, boolean | undefined> => createSelector(
  selectEntitlements,
  (entitlements) => {
    if (entitlements === null) {
      return undefined;
    }
    return entitlements[feature]?.entitled ?? false;
  },
);
