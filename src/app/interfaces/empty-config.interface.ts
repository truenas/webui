import { EmptyType } from 'app/enums/empty-type.enum';
import { TranslatedString } from 'app/helpers/translate.helper';
import { MarkedIcon } from 'app/modules/ix-icon/icon-marker.util';

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
