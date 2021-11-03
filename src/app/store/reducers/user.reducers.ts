import { UserAction, UserActionType } from 'app/store/actions/user.actions';
import { initialUserState, UserState, userAdapter } from 'app/store/states/user.state';

export function userReducer(state = initialUserState, action: UserAction): UserState {
  switch (action.type) {
    case UserActionType.Loading: {
      return { ...state, loading: true };
    }
    case UserActionType.LoadSuccess: {
      return userAdapter.setAll(action.payload, {
        ...state,
        error: false,
        loading: false,
        total: action.payload.length,
      });
    }
    case UserActionType.LoadFailure: {
      return userAdapter.removeAll({
        ...state,
        error: true,
        loading: false,
        total: 0,
      });
    }
    default:
      return state;
  }
}
