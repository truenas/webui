import { Observable } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { MarkedIcon } from 'app/modules/ix-icon/icon-marker.util';

export interface IconActionConfig<T> {
  iconName: MarkedIcon;
  tooltip?: string;
  requiredRoles?: Role[];
  onClick: (row: T) => void;
  hidden?: (row: T) => Observable<boolean>;
  disabled?: (row: T) => Observable<boolean>;
  dynamicTooltip?: (row: T) => Observable<string>;
  dynamicRequiredRoles?: (row: T) => Observable<Role[]>;
}
