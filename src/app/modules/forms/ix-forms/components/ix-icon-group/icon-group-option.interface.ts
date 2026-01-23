import { MarkedIcon } from 'app/modules/ix-icon/icon-marker.util';

export interface IconGroupOption {
  icon: MarkedIcon | string;
  label: string;
  value: string;
  description?: string;
}
