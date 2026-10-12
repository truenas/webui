import { defaultLanguage } from 'app/constants/languages.constant';
import { Preferences } from 'app/interfaces/preferences.interface';

/**
 * The shortest Session Timeout the UI accepts. `AuthService` renews the session token against
 * half the configured lifetime and treats anything shorter as this value, so the floor it renews
 * on and the floor the preferences form validates against have to be the same number.
 */
export const minSessionLifetime = 30;

/**
 * The longest Session Timeout the UI accepts. `SessionTimeoutService` arms a `setTimeout` for the
 * whole lifetime in milliseconds, and browsers overflow anything past 2^31 - 1 ms (~24.8 days).
 */
export const maxSessionLifetime = 2147482;

export const defaultPreferences: Preferences = {
  userTheme: 'default',
  syncThemeWithOS: false,
  lightTheme: 'ix-blue',
  darkTheme: 'ix-dark',
  dateFormat: 'yyyy-MM-DD',
  timeFormat: 'HH:mm:ss',
  sidenavStatus: {
    isCollapsed: false,
    isOpen: true,
    mode: 'over',
  },
  tableDisplayedColumns: [],

  hideBuiltinGroups: true,

  showSnapshotExtraColumns: false,

  rebootAfterManualUpdate: false,
  autoRefreshReports: false,
  lifetime: 300,
  language: defaultLanguage,
  terminalFontSize: 14,
};
