import { SidenavStatusData } from 'app/interfaces/events/sidenav-status-event.interface';

interface Column {
  name: string;
  prop: string;
  hidden: boolean;
  maxWidth: number;
  minWidth: number;
}

export interface TableDisplayedColumns {
  title: string;
  cols: Column[];
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
  showUserListMessage: boolean;
  showGroupListMessage: boolean;
  hideBuiltinUsers: boolean;
  hideBuiltinGroups: boolean;

  rebootAfterManualUpdate: boolean;
}
