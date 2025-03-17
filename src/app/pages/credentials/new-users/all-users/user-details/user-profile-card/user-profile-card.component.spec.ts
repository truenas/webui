import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { User } from 'app/interfaces/user.interface';
import { UserProfileCardComponent } from 'app/pages/credentials/new-users/all-users/user-details/user-profile-card/user-profile-card.component';

const user = {
  uid: 2937,
  full_name: 'Peter Gibbons',
  email: 'peter@initech.com',
  local: true,
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

  it('shows rows', () => {
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
});
