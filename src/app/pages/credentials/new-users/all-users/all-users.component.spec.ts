import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { MasterDetailViewComponent } from 'app/modules/master-detail-view/master-detail-view.component';
import { MockMasterDetailViewComponent } from 'app/modules/master-detail-view/testing/mock-master-detail-view.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { AllUsersComponent } from './all-users.component';

describe('AllUsersComponent', () => {
  let spectator: Spectator<AllUsersComponent>;

  const createComponent = createComponentFactory({
    component: AllUsersComponent,
    imports: [
      MockComponent(MockMasterDetailViewComponent),
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
