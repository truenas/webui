import { createFeatureSelector, createSelector } from '@ngrx/store';
import { failoverAllowedReasons } from 'app/enums/failover-disabled-reason.enum';
import { HaInfoState } from 'app/store/ha-info/ha-info.reducer';

export const haInfoStateKey = 'haInfo';

export const selectHaInfoState = createFeatureSelector<HaInfoState>(haInfoStateKey);

export const selectHaStatus = createSelector(
  selectHaInfoState,
  (state) => state?.haStatus,
);

export const selectIsHaLicensed = createSelector(
  selectHaInfoState,
  (state) => state?.isHaLicensed || false,
);

export const selectIsHaEnabled = createSelector(
  selectHaStatus,
  (state) => state?.hasHa || false,
);

export const selectCanFailover = createSelector(
  selectHaInfoState,
  ({ haStatus }) => {
    if (!haStatus?.reasons) {
      return false;
    }

    if (haStatus.hasHa) {
      return true;
    }

    return haStatus.reasons.every((reason) => failoverAllowedReasons.includes(reason));
  },
);
