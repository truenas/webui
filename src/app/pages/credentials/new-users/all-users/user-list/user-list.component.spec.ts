import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createRoutingFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { mockUserApiDataProvider, mockUsers } from 'app/pages/credentials/new-users/all-users/testing/mock-user-api-data-provider';
import { UserListComponent } from 'app/pages/credentials/new-users/all-users/user-list/user-list.component';
import { UsersSearchComponent } from 'app/pages/credentials/new-users/all-users/users-search/users-search.component';

describe('UserListComponent', () => {
  let spectator: Spectator<UserListComponent>;
  let table: IxTableHarness;

  const createComponent = createRoutingFactory({
    component: UserListComponent,
    imports: [
      MockComponent(IxTableComponent),
      MockComponent(UsersSearchComponent),
      EmptyComponent,
      FakeProgressBarComponent,
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
    table = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, IxTableHarness);
  });

  describe('Rendering users', () => {
    it('should show a list of users', async () => {
      expect(await table.getCellTexts()).toEqual([
        ['Username', 'UID', 'Built in', 'Full Name', 'Access'],
        [
          mockUsers[0].username,
          mockUsers[0].uid.toString(),
          mockUsers[0].builtin ? 'Yes' : 'No',
          mockUsers[0].full_name,
          'Full Admin',
        ],
        [
          mockUsers[1].username,
          mockUsers[1].uid.toString(),
          mockUsers[1].builtin ? 'Yes' : 'No',
          mockUsers[1].full_name,
          'Full Admin',
        ],
      ]);
    });
  });
});
