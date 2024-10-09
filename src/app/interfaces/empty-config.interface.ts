import { EmptyType } from 'app/enums/empty-type.enum';
import { MarkedIcon } from 'app/modules/ix-icon/icon-marker.util';

export interface EmptyConfig {
  type?: EmptyType;
  large?: boolean;
  compact?: boolean;
  title: string;
  message?: string;
  icon?: MarkedIcon;
  button?: {
    label: string;
    action: () => void;
  };
}
