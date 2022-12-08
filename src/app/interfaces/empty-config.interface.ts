import { EmptyType } from 'app/enums/empty-type.enum';

export interface EmptyConfig {
  type?: EmptyType;
  large?: boolean;
  compact?: boolean;
  title: string;
  message?: string;
  icon?: string;
  button?: {
    label: string;
    action: () => void;
  };
}
