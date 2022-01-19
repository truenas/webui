import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AppState } from 'app/store/index';
import { SystemConfigState } from 'app/store/system-config/system-config.reducer';

export const systemConfigStateKey = 'systemConfig';

export const selectSystemConfigState = createFeatureSelector<AppState, SystemConfigState>(systemConfigStateKey);

export const selectGeneralConfig = createSelector(
  selectSystemConfigState,
  (state) => state.generalConfig,
);
export const selectTimezone = createSelector(
  selectGeneralConfig,
  (config) => config?.timezone,
);

export const selectAdvancedConfig = createSelector(
  selectSystemConfigState,
  (state) => state.advancedConfig,
);
