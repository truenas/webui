import { createComponentFactory, Spectator, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { User } from 'app/interfaces/user.interface';
import { MasterDetailViewComponent } from 'app/modules/master-detail-view/master-detail-view.component';
import { MockMasterDetailViewComponent } from 'app/modules/master-detail-view/testing/mock-master-detail-view.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { UsersStore } from 'app/pages/credentials/new-users/store/users.store';
import { AllUsersComponent } from './all-users.component';

describe('AllUsersComponent', () => {
  let spectator: Spectator<AllUsersComponent>;

  const createComponent = createComponentFactory({
    component: AllUsersComponent,
    imports: [
      MockComponent(MockMasterDetailViewComponent),
    ],
    providers: [
      mockProvider(UsersStore, {
        initialize: jest.fn(),
        selectedUser: jest.fn(),
        users: jest.fn(() => [] as User[]),
        isLoading: jest.fn(() => false),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('initializes component', () => {
    expect(spectator.query(PageHeaderComponent)).toExist();
    expect(spectator.query(MasterDetailViewComponent)).toExist();
  });

  it('initializes store on init', () => {
    spectator.component.ngOnInit();
    expect(spectator.inject(UsersStore).initialize).toHaveBeenCalled();
  });
});
