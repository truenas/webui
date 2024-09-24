import { createFeatureSelector, createSelector } from '@ngrx/store';
import { RebootInfoState } from 'app/store/reboot-info/reboot-info.reducer';

export const rebootInfoStateKey = 'rebootInfo';

export const selectRebootInfoState = createFeatureSelector<RebootInfoState>(rebootInfoStateKey);

export const selectThisNodeInfo = createSelector(
  selectRebootInfoState,
  (state) => state?.thisNodeInfo,
);

export const selectOtherNodeInfo = createSelector(
  selectRebootInfoState,
  (state) => state?.otherNodeInfo,
);
