import { routerReducer, RouterReducerState } from '@ngrx/router-store';
import { ActionReducerMap } from '@ngrx/store';
import { snapshotReducer } from 'app/store/reducers/storage-snapshot.reducers';
import { userReducer } from 'app/store/reducers/user.reducers';
import { CustomRouterState } from 'app/store/serializers/custom-router-serializer';
import { SnapshotState } from 'app/store/states/storage-snapshot.state';
import { UserState } from 'app/store/states/user.state';

export interface AppState {
  router: RouterReducerState<CustomRouterState>;
  user: UserState;
  snapshot: SnapshotState;
}

export const reducers: ActionReducerMap<AppState> = {
  router: routerReducer,
  user: userReducer,
  snapshot: snapshotReducer,
};
