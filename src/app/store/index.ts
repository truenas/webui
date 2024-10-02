import { routerReducer, RouterReducerState } from '@ngrx/router-store';
import { ActionReducerMap } from '@ngrx/store';
import { JobEffects } from 'app/modules/jobs/store/job.effects';
import { jobReducer, JobsState } from 'app/modules/jobs/store/job.reducer';
import { jobStateKey } from 'app/modules/jobs/store/job.selectors';
import { GroupEffects } from 'app/pages/credentials/groups/store/group.effects';
import { groupReducer, GroupsState } from 'app/pages/credentials/groups/store/group.reducer';
import { groupStateKey } from 'app/pages/credentials/groups/store/group.selectors';
import { UserEffects } from 'app/pages/credentials/users/store/user.effects';
import { userReducer, UsersState } from 'app/pages/credentials/users/store/user.reducer';
import { userStateKey } from 'app/pages/credentials/users/store/user.selectors';
import { EulaEffects } from 'app/store/eula/eula.effects';
import { HaFipsEffects } from 'app/store/ha-fips/ha-fips.effects';
import { HaInfoEffects } from 'app/store/ha-info/ha-info.effects';
import { haInfoReducer, HaInfoState } from 'app/store/ha-info/ha-info.reducer';
import { haInfoStateKey } from 'app/store/ha-info/ha-info.selectors';
import { HaUpgradeEffects } from 'app/store/ha-upgrade/ha-upgrade.effects';
import { NetworkInterfacesEffects } from 'app/store/network-interfaces/network-interfaces.effects';
import {
  networkInterfacesReducer,
  NetworkInterfacesState,
} from 'app/store/network-interfaces/network-interfaces.reducer';
import { networkInterfacesKey } from 'app/store/network-interfaces/network-interfaces.selectors';
import { PreferencesEffects } from 'app/store/preferences/preferences.effects';
import { preferencesReducer, PreferencesState } from 'app/store/preferences/preferences.reducer';
import { preferencesStateKey } from 'app/store/preferences/preferences.selectors';
import { CustomRouterState } from 'app/store/router/custom-router-serializer';
import { ServicesEffects } from 'app/store/services/services.effects';
import { servicesReducer, ServicesState } from 'app/store/services/services.reducer';
import { SystemConfigEffects } from 'app/store/system-config/system-config.effects';
import { systemConfigReducer, SystemConfigState } from 'app/store/system-config/system-config.reducer';
import { systemConfigStateKey } from 'app/store/system-config/system-config.selectors';
import { SystemInfoEffects } from 'app/store/system-info/system-info.effects';
import { systemInfoReducer, SystemInfoState } from 'app/store/system-info/system-info.reducer';
import { systemInfoStateKey } from 'app/store/system-info/system-info.selectors';
import { servicesStateKey } from './services/services.selectors';

export interface AppsState {
  [systemConfigStateKey]: SystemConfigState;
  [preferencesStateKey]: PreferencesState;
  [systemInfoStateKey]: SystemInfoState;
  [haInfoStateKey]: HaInfoState;
  [servicesStateKey]: ServicesState;
  [networkInterfacesKey]: NetworkInterfacesState;
  [jobStateKey]: JobsState;
  [userStateKey]: UsersState;
  [groupStateKey]: GroupsState;
  router: RouterReducerState<CustomRouterState>;
}

export const rootReducers: ActionReducerMap<AppsState> = {
  [systemConfigStateKey]: systemConfigReducer,
  [preferencesStateKey]: preferencesReducer,
  [systemInfoStateKey]: systemInfoReducer,
  [haInfoStateKey]: haInfoReducer,
  [servicesStateKey]: servicesReducer,
  [networkInterfacesKey]: networkInterfacesReducer,
  [jobStateKey]: jobReducer,
  [userStateKey]: userReducer,
  [groupStateKey]: groupReducer,
  router: routerReducer,
};
export const rootEffects = [
  SystemConfigEffects,
  PreferencesEffects,
  SystemInfoEffects,
  HaInfoEffects,
  EulaEffects,
  HaUpgradeEffects,
  ServicesEffects,
  NetworkInterfacesEffects,
  HaFipsEffects,
  JobEffects,
  UserEffects,
  GroupEffects,
];
