import { MarkedIcon } from 'app/modules/ix-icon/icon-marker.util';

export interface SnackbarConfig {
  message: string;
  iconCssColor?: string;
  icon?: MarkedIcon;
  button?: {
    title: string;
    action: () => void;
  };
}
