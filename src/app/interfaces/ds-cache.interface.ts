import { CallResponse } from '@truenas/api-client';
import { AccountAttribute } from 'app/enums/account-attribute.enum';
import { Role } from 'app/enums/role.enum';
import { DashConfigItem } from 'app/interfaces/dash-config-item.interface';
import { Preferences } from 'app/interfaces/preferences.interface';
import { UserTwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

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

export interface LoggedInUser extends DsUncachedUser {
  privilege: AuthMePrivilege;
  account_attributes: AccountAttribute[];
  two_factor_config: UserTwoFactorConfig;
}

/**
 * Reads `auth.me`. Middleware declares `two_factor_config` and `privilege` as loose records, and the
 * privilege's roles arrive in the `{ $set }` envelope its JSON encoder writes for a set.
 */
export function toLoggedInUser(user: CallResponse<WebUiApiDirectory, 'auth.me'>): LoggedInUser {
  return user as unknown as LoggedInUser;
}

export interface AuthMePrivilege {
  roles: {
    $set: Role[];
  };
  web_shell: boolean;
  webui_access: boolean;
}
