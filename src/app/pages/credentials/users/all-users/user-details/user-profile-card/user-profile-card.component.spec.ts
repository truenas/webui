import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { User } from 'app/interfaces/user.interface';
import { UserProfileCardComponent } from 'app/pages/credentials/users/all-users/user-details/user-profile-card/user-profile-card.component';

const user = {
  uid: 2937,
  full_name: 'Peter Gibbons',
  email: 'peter@initech.com',
  local: true,
  builtin: false,
  group: {
    bsdgrp_group: 'developers',
  },
  home: '/somewhere',
} as User;

describe('UserProfileCardComponent', () => {
  let spectator: Spectator<UserProfileCardComponent>;

  const createComponent = createComponentFactory({
    component: UserProfileCardComponent,
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
    expect(spectator.query('mat-card-header h3')).toHaveText('Profile');
  });

  it('shows user details', () => {
    const rows = getRows();
    expect(rows).toEqual({
      'Email:': 'peter@initech.com',
      'Full Name:': 'Peter Gibbons',
      'Group:': 'developers',
      'Home Directory:': '/somewhere',
      'Type:': 'Local',
      'UID:': '2937',
    });
  });

  describe('User Type Display', () => {
    it('shows Built-In for builtin users', () => {
      const builtinUser = { ...user, builtin: true, local: false };
      spectator.setInput({ user: builtinUser });
      const rows = getRows();
      expect(rows['Type:']).toBe('Built-In');
    });

    it('shows Local for local users', () => {
      const localUser = { ...user, builtin: false, local: true };
      spectator.setInput({ user: localUser });
      const rows = getRows();
      expect(rows['Type:']).toBe('Local');
    });

    it('shows Directory Services for non-local, non-builtin users', () => {
      const directoryUser = { ...user, builtin: false, local: false };
      spectator.setInput({ user: directoryUser });
      const rows = getRows();
      expect(rows['Type:']).toBe('Directory Services');
    });
  });

  it('shows "None" when home directory is /nonexistent', () => {
    spectator.setInput('user', {
      id: 1,
      username: 'testuser',
      home: '/nonexistent',
      group: {
        bsdgrp_group: 'testgroup',
      },
    } as User);

    const rows = getRows();
    expect(rows['Home Directory:']).toBe('None');
  });
});
