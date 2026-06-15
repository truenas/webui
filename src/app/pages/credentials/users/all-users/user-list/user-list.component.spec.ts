import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createRoutingFactory, Spectator } from '@ngneat/spectator/jest';
import { TnTableHarness } from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockUserApiDataProvider, mockUsers } from 'app/pages/credentials/users/all-users/testing/mock-user-api-data-provider';
import { UserListComponent } from 'app/pages/credentials/users/all-users/user-list/user-list.component';
import { UsersSearchComponent } from 'app/pages/credentials/users/all-users/users-search/users-search.component';

describe('UserListComponent', () => {
  let spectator: Spectator<UserListComponent>;
  let table: TnTableHarness;

  const createComponent = createRoutingFactory({
    component: UserListComponent,
    imports: [
      MockComponent(UsersSearchComponent),
    ],
    providers: [
      mockAuth(),
    ],
    params: {
      id: 'invalid',
    },
  });

  beforeEach(async () => {
    spectator = createComponent({
      props: {
        dataProvider: mockUserApiDataProvider,
      },
    });
    jest.spyOn(spectator.component.userSelected, 'emit');
    table = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, TnTableHarness);
  });

  describe('Rendering users', () => {
    it('should show a list of users', async () => {
      expect(await table.getHeaderTexts()).toEqual(['Username', 'Full Name', 'Type', 'Access']);

      expect(await table.getAllRowTexts()).toEqual([
        [
          mockUsers[0].username,
          mockUsers[0].full_name,
          'Local',
          'Full Admin',
        ],
        [
          mockUsers[1].username,
          mockUsers[1].full_name,
          'Built-In',
          'Full Admin',
        ],
      ]);
    });

    it('navigates to user details when a row is clicked', async () => {
      await table.clickRow(0);

      expect(spectator.component.userSelected.emit).toHaveBeenCalledWith(mockUsers[0]);
    });
  });
});
