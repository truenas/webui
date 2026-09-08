import { createReducer, on } from '@ngrx/store';
import { EntitlementMap } from 'app/interfaces/entitlement.interface';
import { entitlementsLoaded, entitlementsLoadFailed } from 'app/store/entitlements/entitlements.actions';

export interface EntitlementsState {
  /** `null` until the first load resolves — distinct from an empty map. */
  entitlements: EntitlementMap | null;
}

const initialState: EntitlementsState = {
  entitlements: null,
};

export const entitlementsReducer = createReducer(
  initialState,
  on(entitlementsLoaded, (state, { entitlements }) => ({ ...state, entitlements })),
  /**
   * An empty map reads as "nothing is restricted", so a failed fetch is permissive rather than
   * a blackout of every licensed surface. This follows the middleware contract for the endpoint
   * (an absent key means not gated) and is deliberate (NAS-143012): every middleware this UI
   * ships with implements `truenas.entitlements.info`. Keeps a previously loaded map so a
   * failed refresh never downgrades a good answer.
   */
  on(entitlementsLoadFailed, (state) => ({ ...state, entitlements: state.entitlements ?? {} })),
);
