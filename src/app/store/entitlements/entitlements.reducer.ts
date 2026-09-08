import { createReducer, on } from '@ngrx/store';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { EntitlementReason } from 'app/enums/entitlement-reason.enum';
import { EntitlementMap } from 'app/interfaces/entitlement.interface';
import { entitlementsLoaded, entitlementsLoadFailed } from 'app/store/entitlements/entitlements.actions';

export interface EntitlementsState {
  /** `null` until the first load resolves — distinct from an empty map. */
  entitlements: EntitlementMap | null;
}

const initialState: EntitlementsState = {
  entitlements: null,
};

/**
 * What a failed first load resolves to. Empty means "nothing is restricted", which is the safe
 * default for a feature gate: the UI stays usable and middleware still enforces the licence.
 * SUPPORT is the one key read the other way round — its consumers offer the community
 * affordances (the JIRA ticket form, the forum feature-vote link, force topology) when it is
 * denied, and the licensed alternatives fail outright without a contract — so unknown has to
 * read as no support rather than as support.
 */
const failedLoadEntitlements: EntitlementMap = {
  [EntitlementFeature.Support]: {
    entitled: false,
    reason: EntitlementReason.NoLicense,
    message: 'Entitlements could not be loaded; support is assumed absent.',
  },
};

export const entitlementsReducer = createReducer(
  initialState,
  on(entitlementsLoaded, (state, { entitlements }) => ({ ...state, entitlements })),
  /**
   * A failed fetch is permissive (see `failedLoadEntitlements`) rather than a blackout of every
   * licensed surface. This follows the middleware contract for the endpoint (an absent key means
   * not gated) and is deliberate (NAS-143012): every middleware this UI ships with implements
   * `truenas.entitlements.info`. Keeps a previously loaded map so a failed refresh never
   * downgrades a good answer.
   */
  on(entitlementsLoadFailed, (state) => ({
    ...state,
    entitlements: state.entitlements ?? failedLoadEntitlements,
  })),
);
