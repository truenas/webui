import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { User } from 'app/interfaces/user.interface';
import { UserAccessCardComponent } from 'app/pages/credentials/new-users/all-users/user-details/user-access-card/user-access-card.component';
import { UserDetailsComponent } from 'app/pages/credentials/new-users/all-users/user-details/user-details.component';
import { UserPasswordCardComponent } from 'app/pages/credentials/new-users/all-users/user-details/user-password-card/user-password-card.component';
import { UserProfileCardComponent } from 'app/pages/credentials/new-users/all-users/user-details/user-profile-card/user-profile-card.component';

describe('UserDetailsComponent', () => {
  let spectator: Spectator<UserDetailsComponent>;
  const createComponent = createComponentFactory({
    component: UserDetailsComponent,
    imports: [
      MockComponents(
        UserProfileCardComponent,
        UserPasswordCardComponent,
        UserAccessCardComponent,
      ),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        user: {
          id: 1,
          username: 'testuser',
          password_disabled: false,
        } as unknown as User,
      },
    });
  });

  it('should render the cards', () => {
    expect(spectator.query(UserProfileCardComponent)).toExist();
    expect(spectator.query(UserPasswordCardComponent)).toExist();
    expect(spectator.query(UserAccessCardComponent)).toExist();
  });

  it('checks no password card exists when password is disabled', () => {
    spectator.setInput('user', {
      id: 1,
      username: 'testuser',
      password_disabled: true,
    } as unknown as User);

    expect(spectator.query(UserPasswordCardComponent)).not.toExist();
  });
});
