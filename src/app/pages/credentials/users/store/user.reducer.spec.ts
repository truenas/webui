import { User } from 'app/interfaces/user.interface';
import { usersLoaded } from 'app/pages/credentials/users/store/user.actions';
import { userReducer, usersInitialState } from 'app/pages/credentials/users/store/user.reducer';

describe('userReducer', () => {
  it('stores loaded users by id, sorted by username', () => {
    const users = [
      { id: 2, username: 'root' },
      { id: 1, username: 'admin' },
    ] as User[];

    const state = userReducer({ ...usersInitialState, isLoading: true }, usersLoaded({ users }));

    expect(state.isLoading).toBe(false);
    expect(state.ids).toEqual([1, 2]);
    expect(state.entities[2]).toEqual(users[0]);
  });
});
