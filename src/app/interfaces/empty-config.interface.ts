import { EmptyType } from 'app/enums/empty-type.enum';
import { MarkedIcon } from 'app/modules/ix-icon/icon-marker.util';
import { TranslatedString } from 'app/modules/translate/translate.helper';

export interface EmptyConfig {
  type?: EmptyType;
  large?: boolean;
  compact?: boolean;
  title: TranslatedString;
  message?: TranslatedString;
  icon?: MarkedIcon;
  button?: {
    label: TranslatedString;
    action: () => void;
  };
}
