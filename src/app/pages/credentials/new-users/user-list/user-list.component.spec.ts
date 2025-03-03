import { Spectator, byText, createComponentFactory } from '@ngneat/spectator/jest';
import { UserListComponent } from './user-list.component';

describe('UserListComponent', () => {
  let spectator: Spectator<UserListComponent>;

  const createComponent = createComponentFactory({
    component: UserListComponent,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should display placeholder text', () => {
    expect(spectator.query(byText(/User List/))).toBeTruthy();
  });
});
