import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ProductType } from 'app/enums/product-type.enum';
import { selectNotNull } from 'app/helpers/operators/select-not-null.helper';
import { SystemInfoState } from 'app/store/system-info/system-info.reducer';

export const systemInfoStateKey = 'systemInfo';

export const selectSystemInfoState = createFeatureSelector<SystemInfoState>(systemInfoStateKey);

export const selectSystemInfo = createSelector(
  selectSystemInfoState,
  (state) => state.systemInfo,
);

export const selectSystemHostId = createSelector(
  selectSystemInfoState,
  (state) => state.systemHostId,
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

export const selectBuildTime = createSelector(
  selectSystemInfoState,
  (state) => state.buildTime,
);

export const selectIsEnterprise = createSelector(
  selectProductType,
  (productType) => productType === ProductType.ScaleEnterprise,
);

export const waitForSystemInfo = selectNotNull(selectSystemInfo);
