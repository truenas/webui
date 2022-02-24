import { routerReducer, RouterReducerState } from '@ngrx/router-store';
import { ActionReducerMap } from '@ngrx/store';
import { PreferencesEffects } from 'app/store/preferences/preferences.effects';
import { preferencesReducer, PreferencesState } from 'app/store/preferences/preferences.reducer';
import { preferencesStateKey } from 'app/store/preferences/preferences.selectors';
import { CustomRouterState } from 'app/store/router/custom-router-serializer';
import { SystemConfigEffects } from 'app/store/system-config/system-config.effects';
import { systemConfigReducer, SystemConfigState } from 'app/store/system-config/system-config.reducer';
import { systemConfigStateKey } from 'app/store/system-config/system-config.selectors';

export interface AppState {
  [systemConfigStateKey]: SystemConfigState;
  [preferencesStateKey]: PreferencesState;
  router: RouterReducerState<CustomRouterState>;
}

export const rootReducers: ActionReducerMap<AppState> = {
  [systemConfigStateKey]: systemConfigReducer,
  [preferencesStateKey]: preferencesReducer,
  router: routerReducer,
};

export const rootEffects = [SystemConfigEffects, PreferencesEffects];
