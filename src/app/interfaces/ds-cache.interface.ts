import { Preferences } from 'app/interfaces/preferences.interface';
import { TwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
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
  };
}

export interface LoggedInUser extends Partial<DsUncachedUser>, Partial<User> {
  globalTwoFactorConfig: TwoFactorConfig;
}

export interface DsUncachedGroup {
  gr_gid: number;
  gr_mem: unknown[];
  gr_name: string;
}
