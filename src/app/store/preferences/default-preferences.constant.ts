import { Preferences } from 'app/interfaces/preferences.interface';

export const defaultPreferences: Preferences = {
  userTheme: 'default',
  dateFormat: 'yyyy-MM-DD',
  timeFormat: 'HH:mm:ss',
  sidenavStatus: {
    isCollapsed: false,
    isOpen: true,
    mode: 'over',
  },
  tableDisplayedColumns: [],

  hideBuiltinUsers: true,
  hideBuiltinGroups: true,

  showSnapshotExtraColumns: false,
  shownNewFeatureIndicatorKeys: [],

  rebootAfterManualUpdate: false,
  autoRefreshReports: false,
  lifetime: 300,
};
