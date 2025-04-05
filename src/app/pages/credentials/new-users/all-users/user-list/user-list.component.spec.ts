import { Router } from '@angular/router';
import { createRoutingFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Role } from 'app/enums/role.enum';
import { User } from 'app/interfaces/user.interface';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { UserListComponent } from 'app/pages/credentials/new-users/all-users/user-list/user-list.component';
import { UserRowComponent } from 'app/pages/credentials/new-users/all-users/user-list/user-row/user-row.component';
import { UsersStore } from 'app/pages/credentials/new-users/store/users.store';

describe('UserListComponent', () => {
  let spectator: Spectator<UserListComponent>;

  const mockUsers = [
    {
      id: 1,
      username: 'john_doe',
      full_name: 'John Doe',
      locked: false,
      roles: [Role.FullAdmin],
    },
    {
      id: 2,
      username: 'jane_smith',
      full_name: 'Jane Smith',
      locked: false,
      roles: [Role.FullAdmin],
    },
  ] as User[];

  const createComponent = createRoutingFactory({
    component: UserListComponent,
    imports: [
      UserRowComponent,
      EmptyComponent,
      SearchInput1Component,
      FakeProgressBarComponent,
    ],
    providers: [
      mockAuth(),
      mockProvider(UsersStore, {
        users: jest.fn(() => mockUsers),
        isLoading: jest.fn(() => false),
        selectedUser: jest.fn(() => null),
        selectUser: jest.fn(),
      }),
    ],
    params: {
      id: 'invalid',
    },
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  describe('Rendering users', () => {
    it('should show a list of users', () => {
      const userRows = spectator.queryAll(UserRowComponent);
      expect(userRows).toHaveLength(mockUsers.length);
      expect(userRows[0].user()).toEqual(mockUsers[0]);
      expect(userRows[1].user()).toEqual(mockUsers[1]);
    });

    it('redirects to first instance when given invalid instanceId', () => {
      const spyOn = jest.spyOn(spectator.inject(Router), 'navigate');
      expect(spyOn).toHaveBeenCalledWith(['/credentials/users-new', 'view', 'john_doe']);
    });
  });
});
