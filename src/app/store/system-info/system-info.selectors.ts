import { createFeatureSelector, createSelector } from '@ngrx/store';
import { selectNotNull } from 'app/helpers/select-not-null.helper';
import { SystemInfoState } from 'app/store/system-info/system-info.reducer';

export const systemInfoStateKey = 'systemInfo';

export const selectSystemInfoState = createFeatureSelector<SystemInfoState>(systemInfoStateKey);

export const selectSystemInfo = createSelector(
  selectSystemInfoState,
  (state) => state.systemInfo,
);

export const selectHaStatus = createSelector(
  selectSystemInfoState,
  (state) => state.haStatus,
);

export const selectSystemFeatures = createSelector(
  selectSystemInfoState,
  (state) => state.systemFeatures,
);

export const selectIsSystemHaCapable = createSelector(
  selectSystemInfoState,
  (state) => state.isSystemHaCapable,
);

export const selectIsIxHardware = createSelector(
  selectSystemInfoState,
  (state) => state.isIxHardware,
);

export const waitForSystemInfo = selectNotNull(selectSystemInfo);

export const waitForSystemFeatures = selectNotNull(selectSystemFeatures);

export const selectIsUpgradePending = createSelector(
  selectSystemInfoState,
  (state) => state.isUpgradePending,
);

export const selectHasOnlyMissmatchVersionsReason = createSelector(
  selectSystemInfoState,
  (state) => state.hasOnlyMissmatchVersionsReason,
);

export const selectIsHaLicensed = createSelector(
  selectSystemInfoState,
  (state) => state.isHaLicensed,
);
