import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { User } from 'app/interfaces/user.interface';
import { UserPasswordCardComponent } from 'app/pages/credentials/new-users/all-users/user-details/user-password-card/user-password-card.component';

const user = {
  uid: 2937,
  password_age: 1,
  password_history: [],
  password_change_required: false,
  last_password_change: {
    $date: 1697030400000,
  },
} as User;

describe('UserPasswordCardComponent', () => {
  let spectator: Spectator<UserPasswordCardComponent>;

  const createComponent = createComponentFactory({
    component: UserPasswordCardComponent,
  });

  function getRows(): Record<string, string> {
    return spectator.queryAll('.row').reduce((acc, item: HTMLElement) => {
      const key = item.querySelector('.label')!.textContent!;
      const value = item.querySelector('.value')!.textContent!.trim();
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
  }

  beforeEach(() => {
    spectator = createComponent({
      props: { user },
    });
  });

  it('shows header', () => {
    expect(spectator.query('mat-card-header h3')).toHaveText('Password');
  });

  it('shows password details when no change is required', () => {
    const rows = getRows();
    expect(rows).toEqual({
      'Change Required:': 'No',
      'History:': 'No History',
      'Age:': '1 day',
      'Last Change:': '2023-10-11 16:20:00',
    });
  });

  it('shows password details when change password is required', () => {
    spectator.setInput({
      user: {
        ...user,
        password_change_required: true,
        password_age: 4,
        password_history: [1, 2, 3, 4],
        last_password_change: {
          $date: 1697030400000,
        },
      },
    });

    const rows = getRows();
    expect(rows).toEqual({
      'Change Required:': 'Yes',
      'History:': '4 entries',
      'Age:': '4 days',
      'Last Change:': '2023-10-11 16:20:00',
    });
  });
});
