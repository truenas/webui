import { EmptyType } from 'app/enums/empty-type.enum';
import { TranslatedString } from 'app/modules/translate/translate.helper';

export interface EmptyConfig {
  type?: EmptyType;
  large?: boolean;
  compact?: boolean;
  title: TranslatedString;
  message?: TranslatedString;
  icon?: string;
  button?: {
    label: TranslatedString;
    action: () => void;
  };
}
