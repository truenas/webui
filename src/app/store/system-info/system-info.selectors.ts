import { createFeatureSelector, createSelector } from '@ngrx/store';
import { HardwareType } from 'app/enums/hardware-type.enum';
import { getProductTypeForLicense, ProductType } from 'app/enums/product-type.enum';
import { getCopyrightHtml } from 'app/helpers/copyright-text.helper';
import { selectNotNull } from 'app/helpers/operators/select-not-null.helper';
import { SystemInfoState } from 'app/store/system-info/system-info.reducer';

export const systemInfoStateKey = 'systemInfo';

export const selectSystemInfoState = createFeatureSelector<SystemInfoState>(systemInfoStateKey);

export const selectSystemInfo = createSelector(
  selectSystemInfoState,
  (state) => state.systemInfo,
);

export const selectIsIxHardware = createSelector(
  selectSystemInfoState,
  (state) => state.isIxHardware,
);

/**
 * At the moment it's an alias, but let's keep it separate to make it more explicit.
 */
export const selectHasEnclosureSupport = selectIsIxHardware;

export const selectEntitlementFacts = createSelector(
  selectSystemInfoState,
  (state) => state.entitlementFacts,
);

/**
 * TrueNAS appliance hardware — what `system.product_type` used to report as ENTERPRISE.
 * Narrower than `selectIsIxHardware`: a TrueNAS Mini is iX hardware but not an appliance.
 *
 * Use for behaviour gates. Branding follows the license instead: see `selectProductType`.
 */
export const selectIsTruenasHardware = createSelector(
  selectEntitlementFacts,
  (facts) => facts?.hardware_type === HardwareType.Truenas,
);

/**
 * Edition for branding (logo, edition label, copyright line, marketing links).
 * `null` until `truenas.entitlements.facts` loads.
 */
export const selectProductType = createSelector(
  selectEntitlementFacts,
  (facts) => (facts ? getProductTypeForLicense(facts.license_type) : null),
);

export const selectIsEnterprise = createSelector(
  selectProductType,
  (productType) => productType === ProductType.Enterprise,
);

export const selectIsCommunityEdition = createSelector(
  selectProductType,
  (productType) => productType === ProductType.CommunityEdition,
);

/**
 * Branding that drops the Community Edition treatment. Prefer this over `selectIsEnterprise`
 * unless a surface has an Enterprise-only asset. `false` until the facts load.
 */
export const selectIsCommercialOrEnterprise = createSelector(
  selectProductType,
  (productType) => productType === ProductType.Commercial || productType === ProductType.Enterprise,
);

export const selectCopyrightHtml = createSelector(
  selectProductType,
  (productType) => getCopyrightHtml(productType || undefined),
);

export const selectLicense = createSelector(
  selectSystemInfo,
  (systemInfo) => systemInfo?.license ?? null,
);

export const waitForSystemInfo = selectNotNull(selectSystemInfo);
