import { Role } from 'app/enums/role.enum';

export interface ConfirmForceDeleteDialogConfig {
  title: string;
  message: string;
  requiredRoles?: Role[];
}

export interface ConfirmForceDeleteDialogResponse {
  confirmed: boolean;
  force?: boolean;
}
