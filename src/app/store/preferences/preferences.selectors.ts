import { createFeatureSelector, createSelector } from '@ngrx/store';
import { selectNotNull } from 'app/helpers/operators/select-not-null.helper';
import { AppsState } from 'app/store/index';
import { PreferencesState } from 'app/store/preferences/preferences.reducer';

export const preferencesStateKey = 'preferences';

export const selectPreferencesState = createFeatureSelector<AppsState, PreferencesState>(preferencesStateKey);

export const selectPreferences = createSelector(
  selectPreferencesState,
  (state) => state.preferences,
);
export const waitForPreferences = selectNotNull(selectPreferences);

export const selectTheme = createSelector(
  selectPreferencesState,
  (state) => state.previewTheme || state.preferences?.userTheme,
);
