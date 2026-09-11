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

export const selectCopyrightHtml = createSelector(
  selectProductType,
  (productType) => getCopyrightHtml(productType || undefined),
);

export const selectLicense = createSelector(
  selectSystemInfo,
  (systemInfo) => systemInfo?.license ?? null,
);

/**
 * An Enterprise product type without a license (e.g. unlicensed R-series
 * hardware) is branded as Community Edition in the UI.
 */
export const selectHasCommunityBranding = createSelector(
  selectProductType,
  selectLicense,
  (productType, license) => productType === ProductType.CommunityEdition
    || (productType === ProductType.Enterprise && license === null),
);

export const waitForSystemInfo = selectNotNull(selectSystemInfo);
