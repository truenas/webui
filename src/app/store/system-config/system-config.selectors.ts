import { createFeatureSelector, createSelector } from '@ngrx/store';
import { selectNotNull } from 'app/helpers/operators/select-not-null.helper';
import { SystemConfigState } from 'app/store/system-config/system-config.reducer';

export const systemConfigStateKey = 'systemConfig';

export const selectSystemConfigState = createFeatureSelector<SystemConfigState>(systemConfigStateKey);

export const selectGeneralConfig = createSelector(
  selectSystemConfigState,
  (state) => state.generalConfig,
);

/**
 * Will wait for config to load. Use within .pipe().
 */
export const waitForGeneralConfig = selectNotNull(selectGeneralConfig);

export const selectTimezone = createSelector(
  selectGeneralConfig,
  (config) => config?.timezone,
);

export const selectAdvancedConfig = createSelector(
  selectSystemConfigState,
  (state) => state.advancedConfig,
);

/**
 * Will wait for config to load. Use within .pipe().
 */
export const waitForAdvancedConfig = selectNotNull(selectAdvancedConfig);

export const selectHasConsoleFooter = createSelector(
  selectGeneralConfig,
  (config) => config?.ui_consolemsg,
);
