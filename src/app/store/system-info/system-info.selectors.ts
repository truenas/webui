import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';
import { LicenseFeature } from 'app/enums/license-feature.enum';
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

export const selectBuildYear = createSelector(
  selectSystemInfoState,
  (state) => state.buildYear,
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
 * Selector factory: emits true when the license carries the given feature.
 * Used by `LicenseService.has*$` observables and any component that needs to
 * gate behavior on a specific license feature.
 */
export const selectHasLicenseFeature = (
  feature: LicenseFeature,
): MemoizedSelector<object, boolean> => createSelector(
  selectLicense,
  (license) => license?.features.some((entry) => entry.name === feature) ?? false,
);

export const waitForSystemInfo = selectNotNull(selectSystemInfo);
