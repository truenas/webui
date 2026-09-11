import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ProductType } from 'app/enums/product-type.enum';
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

export const selectProductType = createSelector(
  selectSystemInfoState,
  (state) => state.productType,
);

export const selectIsEnterprise = createSelector(
  selectProductType,
  (productType) => productType === ProductType.Enterprise,
);

export const selectLicense = createSelector(
  selectSystemInfo,
  (systemInfo) => systemInfo?.license ?? null,
);

export const selectLicenseLoadFailed = createSelector(
  selectSystemInfoState,
  (state) => state.licenseLoadFailed,
);

/**
 * Product type used for UI branding (logo, copyright line, nav badge).
 * An Enterprise product type without a license (e.g. unlicensed R-series
 * hardware) is branded as Community Edition.
 *
 * Returns null while an Enterprise system's license is still unknown, so the
 * UI never flashes the wrong edition, and falls back to the raw product type
 * when the license fetch failed rather than silently downgrading a licensed
 * appliance.
 */
export const selectBrandedProductType = createSelector(
  selectProductType,
  selectSystemInfo,
  selectLicenseLoadFailed,
  (productType, systemInfo, licenseLoadFailed) => {
    if (productType !== ProductType.Enterprise) {
      return productType;
    }
    if (!systemInfo) {
      return null;
    }
    if (licenseLoadFailed) {
      return productType;
    }
    return systemInfo.license === null ? ProductType.CommunityEdition : productType;
  },
);

export const selectHasCommunityBranding = createSelector(
  selectBrandedProductType,
  (productType) => productType === ProductType.CommunityEdition,
);

export const selectHasEnterpriseBranding = createSelector(
  selectBrandedProductType,
  (productType) => productType === ProductType.Enterprise,
);

export const selectCopyrightHtml = createSelector(
  selectBrandedProductType,
  (productType) => getCopyrightHtml(productType || undefined),
);

export const waitForSystemInfo = selectNotNull(selectSystemInfo);
