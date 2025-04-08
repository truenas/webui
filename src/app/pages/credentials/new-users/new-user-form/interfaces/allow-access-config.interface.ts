import { Role } from 'app/enums/role.enum';

export interface AllowAccessConfig {
  smbAccess: boolean;
  truenasAccess: {
    enabled: boolean;
    role: Role | 'prompt';
  };
  sshAccess: boolean;
  shellAccess: boolean;
}
