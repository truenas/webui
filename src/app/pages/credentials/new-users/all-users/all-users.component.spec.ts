import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { MasterDetailViewComponent } from 'app/modules/master-detail-view/master-detail-view.component';
import { MockMasterDetailViewComponent } from 'app/modules/master-detail-view/testing/mock-master-detail-view.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { mockUsers } from 'app/pages/credentials/new-users/all-users/testing/mock-user-api-data-provider';
import { UserListComponent } from 'app/pages/credentials/new-users/all-users/user-list/user-list.component';
import { AllUsersComponent } from './all-users.component';

describe('AllUsersComponent', () => {
  let spectator: Spectator<AllUsersComponent>;

  const createComponent = createComponentFactory({
    component: AllUsersComponent,
    imports: [
      MockComponent(MockMasterDetailViewComponent),
      MockComponent(UserListComponent),
    ],
    providers: [
      mockApi([
        mockCall('user.query', mockUsers),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('initializes component', () => {
    expect(spectator.query(PageHeaderComponent)).toExist();
    expect(spectator.query(MasterDetailViewComponent)).toExist();
  });
});
