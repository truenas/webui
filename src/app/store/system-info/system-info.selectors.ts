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

export const waitForSystemInfo = selectNotNull(selectSystemInfo);

export const waitForSystemFeatures = selectNotNull(selectSystemFeatures);
