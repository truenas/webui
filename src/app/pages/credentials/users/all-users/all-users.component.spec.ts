import { Location } from '@angular/common';
import { createComponentFactory, Spectator, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponent } from 'ng-mocks';
import { BehaviorSubject, of } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { CollectionChangeType } from 'app/enums/api.enum';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { GlobalTwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { User } from 'app/interfaces/user.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { MasterDetailViewComponent } from 'app/modules/master-detail-view/master-detail-view.component';
import { MockMasterDetailViewComponent } from 'app/modules/master-detail-view/testing/mock-master-detail-view.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { AllUsersHeaderComponent } from 'app/pages/credentials/users/all-users/all-users-header/all-users-header.component';
import { mockUsers } from 'app/pages/credentials/users/all-users/testing/mock-user-api-data-provider';
import { UserDetailHeaderComponent } from 'app/pages/credentials/users/all-users/user-details/user-detail-header/user-detail-header.component';
import { UserDetailsComponent } from 'app/pages/credentials/users/all-users/user-details/user-details.component';
import { UserListComponent } from 'app/pages/credentials/users/all-users/user-list/user-list.component';
import { UserFormComponent } from 'app/pages/credentials/users/user-form/user-form.component';
import { selectAdvancedConfig } from 'app/store/system-config/system-config.selectors';
import { AllUsersComponent } from './all-users.component';

const mockGlobalTwoFactorConfig: GlobalTwoFactorConfig = {
  id: 1,
  enabled: true,
  window: 0,
  services: { ssh: false },
};

const mockLoggedInUser = {
  pw_uid: 1,
  pw_name: 'admin',
  pw_gecos: 'Admin User',
  pw_dir: '/home/admin',
  pw_shell: '/bin/bash',
  pw_gid: 1,
  privilege: {
    roles: { $set: [] },
    web_shell: true,
    webui_access: true,
  },
  account_attributes: [],
  two_factor_config: {},
  attributes: {
    preferences: {},
    dashState: [],
    appsAgreement: false,
  },
} as LoggedInUser;

describe('AllUsersComponent', () => {
  let spectator: Spectator<AllUsersComponent>;
  let api: MockApiService;
  let location: Location;

  const createComponent = createComponentFactory({
    component: AllUsersComponent,
    imports: [
      MockMasterDetailViewComponent,
      MockComponent(UserListComponent),
      MockComponent(AllUsersHeaderComponent),
      MockComponent(UserDetailHeaderComponent),
    ],
    declarations: [
      UserDetailsComponent,
    ],
    providers: [
      mockApi([
        mockCall('user.query', mockUsers),
      ]),
      mockProvider(FormSidePanelService),
      mockAuth(),
      mockProvider(AuthService, {
        getGlobalTwoFactorConfig: jest.fn(() => of(mockGlobalTwoFactorConfig)),
        hasRole: jest.fn(() => of(true)),
        user$: new BehaviorSubject(mockLoggedInUser),
      }),
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
    expect(location.replaceState).toHaveBeenCalledWith('credentials/users?username=jane_smith');
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

  it('opens the user form in a side panel when Add is requested', () => {
    const usersHeaderComponent = spectator.query(AllUsersHeaderComponent);
    usersHeaderComponent.addUser.emit();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(
      UserFormComponent,
      { title: 'Add User' },
    );
  });

  it('auto-expands the newly added user once its added event arrives', () => {
    const newUser = {
      id: 3,
      username: 'new_test_user',
      full_name: 'New Test User',
      roles: [],
    } as User;
    // The reloaded page must contain the new user so it is re-selected by username.
    api.mockCall('user.query', [...mockUsers, newUser]);

    // Add arms the capture; the server then pushes the "added" event carrying the record.
    spectator.query(AllUsersHeaderComponent).addUser.emit();
    api.emitSubscribeEvent({
      id: newUser.id,
      msg: CollectionChangeType.Added,
      collection: 'user.query',
      fields: newUser,
    });
    spectator.detectChanges();

    const userDetails = spectator.query(UserDetailsComponent);
    expect(userDetails.user()).toBe(newUser);
    expect(location.replaceState).toHaveBeenCalledWith('credentials/users?username=new_test_user');
  });
});
