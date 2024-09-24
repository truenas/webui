import { routerReducer, RouterReducerState } from '@ngrx/router-store';
import { ActionReducerMap } from '@ngrx/store';
import { EulaEffects } from 'app/store/eula/eula.effects';
import { HaFipsEffects } from 'app/store/ha-fips/ha-fips.effects';
import { HaInfoEffects } from 'app/store/ha-info/ha-info.effects';
import { haInfoReducer, HaInfoState } from 'app/store/ha-info/ha-info.reducer';
import { haInfoStateKey } from 'app/store/ha-info/ha-info.selectors';
import { NetworkInterfacesEffects } from 'app/store/network-interfaces/network-interfaces.effects';
import {
  networkInterfacesReducer,
  NetworkInterfacesState,
} from 'app/store/network-interfaces/network-interfaces.reducer';
import { networkInterfacesKey } from 'app/store/network-interfaces/network-interfaces.selectors';
import { PreferencesEffects } from 'app/store/preferences/preferences.effects';
import { preferencesReducer, PreferencesState } from 'app/store/preferences/preferences.reducer';
import { preferencesStateKey } from 'app/store/preferences/preferences.selectors';
import { RebootInfoEffects } from 'app/store/reboot-info/reboot-info.effects';
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
  router: RouterReducerState<CustomRouterState>;
}

export const rootReducers: ActionReducerMap<AppsState> = {
  [systemConfigStateKey]: systemConfigReducer,
  [preferencesStateKey]: preferencesReducer,
  [systemInfoStateKey]: systemInfoReducer,
  [haInfoStateKey]: haInfoReducer,
  [servicesStateKey]: servicesReducer,
  [networkInterfacesKey]: networkInterfacesReducer,
  router: routerReducer,
};
export const rootEffects = [
  SystemConfigEffects,
  PreferencesEffects,
  SystemInfoEffects,
  HaInfoEffects,
  EulaEffects,
  ServicesEffects,
  NetworkInterfacesEffects,
  HaFipsEffects,
  RebootInfoEffects,
];
