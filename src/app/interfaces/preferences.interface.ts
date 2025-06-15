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
  tableDisplayedColumns: TableDisplayedColumns[];
  hideBuiltinUsers: boolean;
  hideBuiltinGroups: boolean;
  autoRefreshReports: boolean;
  showSnapshotExtraColumns: boolean;
  shownNewFeatureIndicatorKeys: string[];

  rebootAfterManualUpdate: boolean;
  lifetime: number;

  language: string;

  terminalFontSize: number;
}
