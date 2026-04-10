import { SidenavStatusData } from 'app/interfaces/events/sidenav-status-event.interface';

export interface TableDisplayedColumns {
  title: string;
  columns: string[];
}

/**
 * @see defaultPreferences
 */
export interface Preferences {
  dateFormat: string;
  timeFormat: string;
  sidenavStatus: SidenavStatusData;
  userTheme: string;
  syncThemeWithOS: boolean;
  lightTheme: string;
  darkTheme: string;
  tableDisplayedColumns: TableDisplayedColumns[];
  hideBuiltinGroups: boolean;
  autoRefreshReports: boolean;
  showSnapshotExtraColumns: boolean;
  shownNewFeatureIndicatorKeys: string[];

  rebootAfterManualUpdate: boolean;
  lifetime: number;

  language: string;

  terminalFontSize: number;
}
