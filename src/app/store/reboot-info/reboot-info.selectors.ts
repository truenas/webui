import { createFeatureSelector, createSelector } from '@ngrx/store';
import { RebootInfoState } from 'app/store/reboot-info/reboot-info.reducer';

export const rebootInfoStateKey = 'rebootInfo';

export const selectRebootInfoState = createFeatureSelector<RebootInfoState>(rebootInfoStateKey);

export const selectRebootInfo = createSelector(
  selectRebootInfoState,
  (state) => state,
);

export const selectThisNodeRebootInfo = createSelector(
  selectRebootInfoState,
  (state) => state?.thisNodeRebootInfo,
);

export const selectOtherNodeRebootInfo = createSelector(
  selectRebootInfoState,
  (state) => state?.otherNodeRebootInfo,
);
