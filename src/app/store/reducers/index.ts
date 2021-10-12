import { routerReducer, RouterReducerState } from '@ngrx/router-store';
import { ActionReducerMap } from '@ngrx/store';
import { CustomRouterState } from 'app/store/serializers/custom-router-serializer';

export interface AppState {
  router: RouterReducerState<CustomRouterState>;
}

export const reducers: ActionReducerMap<AppState> = {
  router: routerReducer,
};
