import { Observable } from 'rxjs';
import { Role } from 'app/enums/role.enum';

export interface IconActionConfig<T> {
  iconName: string;
  tooltip?: string;
  onClick: (row: T) => void;
  dynamicTooltip?: (row: T) => Observable<string>;
  hidden?: (row: T) => Observable<boolean>;
  disabled?: (row: T) => Observable<boolean>;
  requiredRoles?: Role[];
}
