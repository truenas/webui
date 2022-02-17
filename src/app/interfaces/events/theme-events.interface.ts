import { Theme } from 'app/interfaces/theme.interface';
import { ThemeService } from 'app/services/theme/theme.service';

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
