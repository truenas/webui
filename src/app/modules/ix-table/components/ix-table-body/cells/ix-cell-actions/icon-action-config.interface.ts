import { IconSize } from '@truenas/ui-components';
import { Observable } from 'rxjs';
import { Role } from 'app/enums/role.enum';

export interface IconActionConfig<T> {
  iconName: string;
  tooltip?: string;
  requiredRoles?: Role[];
  onClick: (row: T) => void;
  hidden?: (row: T) => Observable<boolean>;
  disabled?: (row: T) => Observable<boolean>;
  dynamicTooltip?: (row: T) => Observable<string>;
  dynamicRequiredRoles?: (row: T) => Observable<Role[]>;
  size?: IconSize;
}
