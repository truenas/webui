import { createFeatureSelector, createSelector } from '@ngrx/store';
import { HaInfoState } from 'app/store/ha-info/ha-info.reducer';

export const haInfoStateKey = 'haInfo';

export const selectHaInfoState = createFeatureSelector<HaInfoState>(haInfoStateKey);

export const selectHaStatus = createSelector(
  selectHaInfoState,
  (state) => state.haStatus,
);

export const selectIsHaLicensed = createSelector(
  selectHaInfoState,
  (state) => state.isHaLicensed,
);

export const selectIsUpgradePending = createSelector(
  selectHaInfoState,
  (state) => state.isUpgradePending,
);

export const selectHasOnlyMismatchVersionsReason = createSelector(
  selectHaInfoState,
  (state) => state.hasOnlyMissmatchVersionsReason,
);
