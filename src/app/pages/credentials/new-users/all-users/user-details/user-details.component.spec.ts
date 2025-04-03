import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { User } from 'app/interfaces/user.interface';
import { UserAccessCardComponent } from 'app/pages/credentials/new-users/all-users/user-details/user-access-card/user-access-card.component';
import { UserDetailsComponent } from 'app/pages/credentials/new-users/all-users/user-details/user-details.component';
import { UserProfileCardComponent } from 'app/pages/credentials/new-users/all-users/user-details/user-profile-card/user-profile-card.component';

describe('UserDetailsComponent', () => {
  let spectator: Spectator<UserDetailsComponent>;
  const createComponent = createComponentFactory({
    component: UserDetailsComponent,
    imports: [
      MockComponents(UserProfileCardComponent),
      MockComponents(UserAccessCardComponent),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        user: {
          id: 1,
          username: 'testuser',
        } as unknown as User,
      },
    });
  });

  it('should render the cards', () => {
    expect(spectator.query(UserProfileCardComponent)).toExist();
    expect(spectator.query(UserAccessCardComponent)).toExist();
  });
});
