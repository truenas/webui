import { Observable } from 'rxjs';

export interface CellActionConfig<T> {
  iconName: string;
  tooltip?: string;
  onClick: (row: T) => void;
  dynamicTooltip?: (row: T) => Observable<string>;
  hidden?: (row: T) => Observable<boolean>;
  disabled?: (row: T) => Observable<boolean>;
}