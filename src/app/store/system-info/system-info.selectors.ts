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

export const selectSystemFeatures = createSelector(
  selectSystemInfoState,
  (state) => state.systemFeatures,
);

export const selectEnclosureSupport = createSelector(
  selectSystemFeatures,
  (features) => features.enclosure,
);

export const selectSystemHostId = createSelector(
  selectSystemInfoState,
  (state) => state.systemHostId,
);

export const selectIsIxHardware = createSelector(
  selectSystemInfoState,
  (state) => state.isIxHardware,
);

export const selectProductType = createSelector(
  selectSystemInfoState,
  (state) => state.productType,
);

export const selectIsEnterprise = createSelector(
  selectProductType,
  (productType) => productType === ProductType.ScaleEnterprise,
);

export const waitForSystemInfo = selectNotNull(selectSystemInfo);

export const waitForSystemFeatures = selectNotNull(selectSystemFeatures);
