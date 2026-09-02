import { createAction, props } from '@ngrx/store';
import { EntitlementMap } from 'app/interfaces/entitlement.interface';

export const entitlementsLoaded = createAction(
  '[Entitlements API] Entitlements Loaded',
  props<{ entitlements: EntitlementMap }>(),
);

export const entitlementsLoadFailed = createAction(
  '[Entitlements API] Entitlements Load Failed',
);
