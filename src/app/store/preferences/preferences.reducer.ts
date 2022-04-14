import { createReducer, on } from '@ngrx/store';
import { Preferences } from 'app/interfaces/preferences.interface';
import { defaultTheme } from 'app/services/theme/theme.constants';
import { defaultPreferences } from 'app/store/preferences/default-preferences.constant';
import {
  builtinGroupsToggled,
  builtinUsersToggled, guiFormClosedWithoutSaving, guiFormSubmitted, localizationFormSubmitted, noPreferencesFound,
  preferencesLoaded, preferredColumnsUpdated, themeChangedInGuiForm,
  themeNotFound,
} from 'app/store/preferences/preferences.actions';
import { sidenavUpdated } from 'app/store/topbar/topbar.actions';
import { snapshotExtraColumnsToggled } from './preferences.actions';

export interface PreferencesState {
  areLoaded: boolean;
  preferences: Preferences;
  previewTheme: string;
}

const initialState: PreferencesState = {
  areLoaded: false,
  preferences: null,
  previewTheme: null,
};

export const preferencesReducer = createReducer(
  initialState,

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
  on(guiFormSubmitted, (state, { theme }) => updatePreferences(state, {
    userTheme: theme,
  })),
  on(themeChangedInGuiForm, (state, { theme }) => ({ ...state, previewTheme: theme })),
  on(guiFormClosedWithoutSaving, (state) => ({ ...state, previewTheme: null })),

  on(themeNotFound, (state) => updatePreferences(state, {
    userTheme: defaultTheme.name,
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
