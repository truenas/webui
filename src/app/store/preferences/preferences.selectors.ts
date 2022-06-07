import { createFeatureSelector, createSelector } from '@ngrx/store';
import { selectNotNull } from 'app/helpers/select-not-null.helper';
import { AppState } from 'app/store/index';
import { PreferencesState } from 'app/store/preferences/preferences.reducer';

export const preferencesStateKey = 'preferences';

export const selectPreferencesState = createFeatureSelector<AppState, PreferencesState>(preferencesStateKey);

export const selectPreferences = createSelector(
  selectPreferencesState,
  (state) => state.preferences,
);
export const waitForPreferences = selectNotNull(selectPreferences);

export const selectTheme = createSelector(
  selectPreferencesState,
  (state) => state.previewTheme || state.preferences?.userTheme,
);

export const selectDashboardState = createSelector(
  selectPreferencesState,
  (state) => state.dashboardState,
);

export const waitForDashboardState = selectNotNull(selectDashboardState);
