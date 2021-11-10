import { routerReducer, RouterReducerState } from '@ngrx/router-store';
import { ActionReducerMap } from '@ngrx/store';
import { userReducer } from 'app/store/reducers/user.reducers';
import { CustomRouterState } from 'app/store/serializers/custom-router-serializer';
import { UserState } from 'app/store/states/user.state';

export interface AppState {
  router: RouterReducerState<CustomRouterState>;
  user: UserState;
}

export const reducers: ActionReducerMap<AppState> = {
  router: routerReducer,
  user: userReducer,
};
