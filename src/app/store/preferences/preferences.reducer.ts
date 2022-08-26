import { createReducer, on } from '@ngrx/store';
import { Preferences } from 'app/interfaces/preferences.interface';
import { DashConfigItem } from 'app/pages/dashboard/components/widget-controller/widget-controller.component';
import { defaultTheme } from 'app/services/theme/theme.constants';
import { defaultPreferences } from 'app/store/preferences/default-preferences.constant';
import {
  builtinGroupsToggled,
  builtinUsersToggled, guiFormClosedWithoutSaving, guiFormSubmitted,
  localizationFormSubmitted, noPreferencesFound,
  preferencesLoaded, preferredColumnsUpdated, themeChangedInGuiForm,
  themeNotFound,
  updateRebootAfterManualUpdate,
} from 'app/store/preferences/preferences.actions';
import { sidenavUpdated } from 'app/store/topbar/topbar.actions';
import { snapshotExtraColumnsToggled, dashboardStateLoaded, noDashboardStateFound } from './preferences.actions';

export interface PreferencesState {
  areLoaded: boolean;
  preferences: Preferences;
  previewTheme: string;
  dashboardState: DashConfigItem[];
}

const initialState: PreferencesState = {
  areLoaded: false,
  preferences: null,
  previewTheme: null,
  dashboardState: null,
};

export const preferencesReducer = createReducer(
  initialState,

  on(dashboardStateLoaded, (state, { dashboardState }) => ({ ...state, dashboardState })),
  on(noDashboardStateFound, (state) => ({ ...state, dashboardState: null })),
  on(preferencesLoaded, (state, { preferences }) => ({ ...state, preferences, areLoaded: true })),
  on(noPreferencesFound, (state) => ({ ...state, preferences: defaultPreferences, areLoaded: true })),
  on(sidenavUpdated, (state, sidenavStatus) => updatePreferences(state, { sidenavStatus })),
  on(preferredColumnsUpdated, (state, { columns }) => updatePreferences(state, {
    tableDisplayedColumns: columns,
  })),
  on(localizationFormSubmitted, (state, { dateFormat, timeFormat }) => updatePreferences(state, {
    dateFormat,
    timeFormat,
  })),

  on(builtinUsersToggled, (state) => updatePreferences(state, {
    hideBuiltinUsers: !state.preferences.hideBuiltinUsers,
  })),
  on(builtinGroupsToggled, (state) => updatePreferences(state, {
    hideBuiltinGroups: !state.preferences.hideBuiltinGroups,
  })),
  on(snapshotExtraColumnsToggled, (state) => updatePreferences(state, {
    showSnapshotExtraColumns: !state.preferences.showSnapshotExtraColumns,
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
  on(updateRebootAfterManualUpdate,
    (state, { rebootAfterManualUpdate }) => updatePreferences(
      state, { rebootAfterManualUpdate },
    )),
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
