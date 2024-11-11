import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ProductType } from 'app/enums/product-type.enum';
import { getCopyrightText } from 'app/helpers/copyright-text.helper';
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
  (productType) => productType === ProductType.ScaleEnterprise,
);

export const selectBuildYear = createSelector(
  selectSystemInfoState,
  (state) => state.buildYear,
);

export const selectCopyrightText = createSelector(
  selectIsEnterprise,
  selectBuildYear,
  (isEnterprise, buildYear) => getCopyrightText(isEnterprise, buildYear),
);

export const waitForSystemInfo = selectNotNull(selectSystemInfo);
