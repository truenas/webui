import { routerReducer, RouterReducerState } from '@ngrx/router-store';
import { ActionReducerMap } from '@ngrx/store';
import { EulaEffects } from 'app/store/eula/eula.effects';
import { HaInfoEffects } from 'app/store/ha-info/ha-info.effects';
import { haInfoReducer, HaInfoState } from 'app/store/ha-info/ha-info.reducer';
import { haInfoStateKey } from 'app/store/ha-info/ha-info.selectors';
import { HaUpgradeEffects } from 'app/store/ha-upgrade/ha-upgrade.effects';
import { PreferencesEffects } from 'app/store/preferences/preferences.effects';
import { preferencesReducer, PreferencesState } from 'app/store/preferences/preferences.reducer';
import { preferencesStateKey } from 'app/store/preferences/preferences.selectors';
import { CustomRouterState } from 'app/store/router/custom-router-serializer';
import { SystemConfigEffects } from 'app/store/system-config/system-config.effects';
import { systemConfigReducer, SystemConfigState } from 'app/store/system-config/system-config.reducer';
import { systemConfigStateKey } from 'app/store/system-config/system-config.selectors';
import { SystemInfoEffects } from 'app/store/system-info/system-info.effects';
import { systemInfoReducer, SystemInfoState } from 'app/store/system-info/system-info.reducer';
import { systemInfoStateKey } from 'app/store/system-info/system-info.selectors';

export interface AppState {
  [systemConfigStateKey]: SystemConfigState;
  [preferencesStateKey]: PreferencesState;
  [systemInfoStateKey]: SystemInfoState;
  [haInfoStateKey]: HaInfoState;
  router: RouterReducerState<CustomRouterState>;
}

export const rootReducers: ActionReducerMap<AppState> = {
  [systemConfigStateKey]: systemConfigReducer,
  [preferencesStateKey]: preferencesReducer,
  [systemInfoStateKey]: systemInfoReducer,
  [haInfoStateKey]: haInfoReducer,
  router: routerReducer,
};

export const rootEffects = [
  SystemConfigEffects,
  PreferencesEffects,
  SystemInfoEffects,
  HaInfoEffects,
  EulaEffects,
  HaUpgradeEffects,
];
