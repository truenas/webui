import { createReducer, on } from '@ngrx/store';
import { Preferences } from 'app/interfaces/preferences.interface';
import { defaultTheme } from 'app/services/theme/theme.constants';
import { defaultPreferences } from 'app/store/preferences/default-preferences.constant';
import {
  builtinGroupsToggled,
  builtinUsersToggled, localizationFormSubmitted,
  noPreferencesFound, oneTimeBuiltinGroupsMessageShown, oneTimeBuiltinUsersMessageShown,
  preferencesFormSubmitted,
  preferencesLoaded, preferencesReset, preferredColumnsUpdated,
  themeNotFound,
} from 'app/store/preferences/preferences.actions';
import { sidenavUpdated } from 'app/store/topbar/topbar.actions';

export interface PreferencesState {
  areLoaded: boolean;
  preferences: Preferences;
}

const initialState: PreferencesState = {
  areLoaded: false,
  preferences: null,
};

export const preferencesReducer = createReducer(
  initialState,

  on(preferencesLoaded, (state, { preferences }) => ({ ...state, preferences, areLoaded: true })),
  on(noPreferencesFound, preferencesReset, (state) => ({
    ...state,
    preferences: defaultPreferences,
    areLoaded: true,
  })),
  on(sidenavUpdated, (state, sidenavStatus) => updatePreferences(state, { sidenavStatus })),
  on(preferencesFormSubmitted, (state, { formValues }) => updatePreferences(state, formValues)),
  on(preferredColumnsUpdated, (state, { columns }) => updatePreferences(state, {
    tableDisplayedColumns: columns,
  })),
  on(localizationFormSubmitted, (state, { dateFormat, timeFormat }) => updatePreferences(state, {
    dateFormat,
    timeFormat,
  })),

  on(oneTimeBuiltinUsersMessageShown, (state) => updatePreferences(state, {
    showUserListMessage: false,
  })),
  on(builtinUsersToggled, (state) => updatePreferences(state, {
    hideBuiltinUsers: !state.preferences.hideBuiltinUsers,
  })),
  on(oneTimeBuiltinGroupsMessageShown, (state) => updatePreferences(state, {
    showGroupListMessage: false,
  })),
  on(builtinGroupsToggled, (state) => updatePreferences(state, {
    hideBuiltinGroups: !state.preferences.hideBuiltinGroups,
  })),

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
