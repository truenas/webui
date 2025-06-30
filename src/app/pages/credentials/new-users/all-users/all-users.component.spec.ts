import { Location } from '@angular/common';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponent } from 'ng-mocks';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { User } from 'app/interfaces/user.interface';
import { MasterDetailViewComponent } from 'app/modules/master-detail-view/master-detail-view.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { AllUsersHeaderComponent } from 'app/pages/credentials/new-users/all-users/all-users-header/all-users-header.component';
import { mockUsers } from 'app/pages/credentials/new-users/all-users/testing/mock-user-api-data-provider';
import { UserDetailHeaderComponent } from 'app/pages/credentials/new-users/all-users/user-details/user-detail-header/user-detail-header.component';
import { UserDetailsComponent } from 'app/pages/credentials/new-users/all-users/user-details/user-details.component';
import { UserListComponent } from 'app/pages/credentials/new-users/all-users/user-list/user-list.component';
import { selectAdvancedConfig } from 'app/store/system-config/system-config.selectors';
import { AllUsersComponent } from './all-users.component';

describe('AllUsersComponent', () => {
  let spectator: Spectator<AllUsersComponent>;
  let api: MockApiService;
  let location: Location;

  const createComponent = createComponentFactory({
    component: AllUsersComponent,
    imports: [
      MasterDetailViewComponent,
      MockComponent(UserListComponent),
      MockComponent(AllUsersHeaderComponent),
    ],
    declarations: [
      UserDetailHeaderComponent,
      UserDetailsComponent,
    ],
    providers: [
      mockApi([
        mockCall('user.query', mockUsers),
      ]),
      mockAuth(),
      provideMockStore({
        selectors: [
          {
            selector: selectAdvancedConfig,
            value: {
              consolemsg: true,
            } as AdvancedConfig,
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    api = spectator.inject(MockApiService);
    location = spectator.inject(Location);
    jest.spyOn(location, 'replaceState');
  });

  it('initializes component', () => {
    expect(spectator.query(PageHeaderComponent)).toExist();
    expect(spectator.query(MasterDetailViewComponent)).toExist();
  });

  it('subscribes to user changes when component initializes', () => {
    expect(api.subscribe).toHaveBeenCalledWith('user.query');
  });

  it('handles user selection by updating expanded row and URL', () => {
    const selectedUser = mockUsers[1];
    const userListComponent = spectator.query(UserListComponent);

    userListComponent.userSelected.emit(selectedUser);
    spectator.detectChanges();

    const userDetails = spectator.query(UserDetailsComponent);

    expect(userDetails.user()).toBe(selectedUser);
    expect(location.replaceState).toHaveBeenCalledWith('credentials/users-new?username=jane_smith');
  });

  it('does not update expanded row when no user is selected', () => {
    const selectedUser = mockUsers[1];
    const userListComponent = spectator.query(UserListComponent);

    userListComponent.userSelected.emit(selectedUser);
    spectator.detectChanges();
    const userDetails = spectator.query(UserDetailsComponent);
    const originalExpandedRow = userDetails.user();
    userListComponent.userSelected.emit(null);
    spectator.detectChanges();

    expect(userDetails.user()).toBe(originalExpandedRow);
  });

  it('loads new user by setting up data provider with the new user username', () => {
    const usersHeaderComponent = spectator.query(AllUsersHeaderComponent);
    const newUser = {
      id: 3,
      username: 'new_test_user',
      full_name: 'New Test User',
      roles: [],
    } as User;
    usersHeaderComponent.userCreated.emit(newUser);

    spectator.detectChanges();

    expect(api.call).toHaveBeenCalledWith('user.query', [[['OR', [['builtin', '=', false], ['username', '=', 'root']]]], { order_by: ['uid'] }]);
    expect(api.call).toHaveBeenCalledWith('user.query', [[['username', '=', 'new_test_user']]]);
  });
});
