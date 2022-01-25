import { Theme, ThemeService } from 'app/services/theme/theme.service';

export interface ThemeListsChangedEvent {
  name: 'ThemeListsChanged';
  sender: unknown;
  data: void;
}

export interface ChangeThemePreferenceEvent {
  name: 'ChangeThemePreference';
  sender: unknown;
  data: string;
}

export interface ThemeChangedEvent {
  name: 'ThemeChanged';
  sender: ThemeService;
  data: Theme;
}

export interface ThemeDataRequestEvent {
  name: 'ThemeDataRequest';
  sender: unknown;
  data: void;
}

export interface ThemeDataEvent {
  name: 'ThemeData';
  sender: unknown;
  data: Theme;
}
