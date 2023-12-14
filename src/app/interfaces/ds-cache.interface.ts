import { Role } from 'app/enums/role.enum';
import { Preferences } from 'app/interfaces/preferences.interface';
import { UserTwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { DashConfigItem } from 'app/pages/dashboard/components/widget-controller/widget-controller.component';
import { User } from './user.interface';

export interface DsUncachedUser {
  pw_dir: string;
  pw_gecos: string;
  pw_gid: number;
  pw_name: string;
  pw_shell: string;
  pw_uid: number;
  attributes: {
    preferences: Preferences;
    dashState: DashConfigItem[];
    appsAgreement: boolean;
  };
}

export interface LoggedInUser extends DsUncachedUser, Partial<User> {
  privilege: AuthMePrivilege;
  two_factor_config: UserTwoFactorConfig;
  local: boolean;
}

export interface AuthMePrivilege {
  roles: {
    $set: Role[];
  };
  web_shell: boolean;
  webui_access: boolean;
}

export interface DsUncachedGroup {
  gr_gid: number;
  gr_mem: unknown[];
  gr_name: string;
}
