import { SidenavStatusData } from 'app/interfaces/events/sidenav-status-event.interface';

interface Column {
  name: string;
  prop: string;
  hidden: boolean;
  maxWidth: number;
  minWidth: number;
}

interface TableDisplayedColumns {
  title: string;
  cols: Column[];
}

export interface Preferences {
  platform: string;
  retroLogo: boolean;
  timestamp: string;
  userTheme: string;
  customThemes: { [theme: string]: any }[];
  sidenavStatus: SidenavStatusData;

  /**
   * @deprecated
   */
  favoriteThemes: { [theme: string]: any }[];
  showGuide: boolean;
  showTooltips: boolean;
  metaphor: string;
  allowPwToggle: boolean;
  preferIconsOnly: boolean;
  rebootAfterManualUpdate: boolean;
  tableDisplayedColumns: TableDisplayedColumns[];
  hide_builtin_users: boolean;
  hide_builtin_groups: boolean;
  dateFormat: string;
  timeFormat: string;
  showWelcomeDialog: boolean;
  showUserListMessage: boolean;
  showGroupListMessage: boolean;
  expandAvailablePlugins: boolean;
  storedValues: { [value: string]: any };
  [preference: string]: any;
}
