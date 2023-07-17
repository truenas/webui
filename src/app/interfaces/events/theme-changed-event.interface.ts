import { Theme } from 'app/interfaces/theme.interface';

export interface ThemeChangedEvent {
  name: 'ThemeChanged';
  sender: unknown;
  data: Theme;
}
