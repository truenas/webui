import { createReducer, on } from '@ngrx/store';
import { DashConfigItem } from 'app/interfaces/dash-config-item.interface';
import { Preferences } from 'app/interfaces/preferences.interface';
import { defaultTheme } from 'app/modules/theme/theme.constants';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import { defaultPreferences } from 'app/store/preferences/default-preferences.constant';
import {
  autoRefreshReportsToggled,
  builtinGroupsToggled,
  builtinUsersToggled, dashboardStateUpdated, guiFormClosedWithoutSaving, guiFormSubmitted,
  lifetimeTokenUpdated,
  localizationFormSubmitted, noPreferencesFound,
  preferencesLoaded, preferredColumnsUpdated, shownNewIndicatorKeysUpdated, themeChangedInGuiForm,
  themeNotFound,
  updateRebootAfterManualUpdate,
} from 'app/store/preferences/preferences.actions';
import { sidenavUpdated } from 'app/store/topbar/topbar.actions';
import { snapshotExtraColumnsToggled, dashboardStateLoaded, noDashboardStateFound } from './preferences.actions';

export interface PreferencesState {
  areLoaded: boolean;
  preferences: Preferences | null;
  previewTheme: string | null;
  dashboardState: DashConfigItem[] | null;
}

const initialState: PreferencesState = {
  areLoaded: false,
  preferences: null,
  previewTheme: null,
  dashboardState: null,
};

export const preferencesReducer = createReducer(
  initialState,

  on(dashboardStateLoaded, dashboardStateUpdated, (state, { dashboardState }) => ({ ...state, dashboardState })),
  on(noDashboardStateFound, (state) => ({ ...state, dashboardState: null })),
  on(adminUiInitialized, () => ({ ...initialState, areLoaded: false })),
  on(preferencesLoaded, (state, { preferences }) => ({ ...state, preferences, areLoaded: true })),
  on(noPreferencesFound, (state) => ({ ...state, preferences: defaultPreferences, areLoaded: true })),
  on(sidenavUpdated, (state, sidenavStatus) => updatePreferences(state, { sidenavStatus })),
  on(preferredColumnsUpdated, (state, { columns }) => updatePreferences(state, {
    tableDisplayedColumns: columns,
  })),
  on(shownNewIndicatorKeysUpdated, (state, { keys }) => updatePreferences(state, {
    shownNewFeatureIndicatorKeys: keys,
  })),
  on(localizationFormSubmitted, (state, { dateFormat, timeFormat }) => updatePreferences(state, {
    dateFormat,
    timeFormat,
  })),
  on(lifetimeTokenUpdated, (state, { lifetime }) => updatePreferences(state, { lifetime })),

  on(builtinUsersToggled, (state) => updatePreferences(state, {
    hideBuiltinUsers: !state.preferences?.hideBuiltinUsers,
  })),
  on(builtinGroupsToggled, (state) => updatePreferences(state, {
    hideBuiltinGroups: !state.preferences?.hideBuiltinGroups,
  })),
  on(snapshotExtraColumnsToggled, (state) => updatePreferences(state, {
    showSnapshotExtraColumns: !state.preferences?.showSnapshotExtraColumns,
  })),
  on(guiFormSubmitted, (state, { theme }) => ({
    ...updatePreferences(state, { userTheme: theme }),
    previewTheme: null,
  })),
  on(themeChangedInGuiForm, (state, { theme }) => ({ ...state, previewTheme: theme })),
  on(guiFormClosedWithoutSaving, (state) => ({ ...state, previewTheme: null })),
  on(themeNotFound, (state) => updatePreferences(state, {
    userTheme: defaultTheme.name,
  })),
  on(
    updateRebootAfterManualUpdate,
    (state, { rebootAfterManualUpdate }) => updatePreferences(
      state,
      { rebootAfterManualUpdate },
    ),
  ),
  on(autoRefreshReportsToggled, (state) => updatePreferences(state, {
    autoRefreshReports: !state.preferences?.autoRefreshReports,
  })),
);

export function updatePreferences(state: PreferencesState, update: Partial<Preferences>): PreferencesState {
  return {
    ...state,
    preferences: {
      ...state.preferences,
      ...update,
    },
  };
}
