import { createHostFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { BehaviorSubject } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { AuthService } from 'app/services/auth/auth.service';
import { HasRolesDirective } from './has-roles.directive';

describe('HasRolesDirective', () => {
  let spectator: Spectator<HasRolesDirective>;
  const currentUser$ = new BehaviorSubject<LoggedInUser>(null);

  const createHost = createHostFactory({
    component: HasRolesDirective,
    providers: [
      mockProvider(AuthService, {
        user$: currentUser$,
      }),
    ],
  });

  it('does not show an element when there is no logged in user', () => {
    spectator = createHost(
      '<div *ixHasRoles="[Role.Readonly]">Content</div>',
      {
        hostProps: { Role },
      },
    );

    expect(spectator.query('div')).not.toExist();
  });

  it('shows an element when user has a FullAdmin role regardless of roles on the element', () => {
    currentUser$.next({
      privilege: {
        roles: {
          $set: [Role.FullAdmin],
        },
      },
    } as LoggedInUser);

    spectator = createHost(
      '<div *ixHasRoles="[Role.DatasetWrite]">Content</div>',
      {
        hostProps: { Role },
      },
    );

    expect(spectator.query('div')).toHaveText('Content');
  });

  it('shows an element when one of the user`s roles matches one of the roles required on the element', () => {
    currentUser$.next({
      privilege: {
        roles: {
          $set: [Role.DatasetRead, Role.DatasetWrite],
        },
      },
    } as LoggedInUser);

    spectator = createHost(
      '<div *ixHasRoles="[Role.DatasetRead, Role.Readonly]">Content</div>',
      {
        hostProps: { Role },
      },
    );

    expect(spectator.query('div')).toHaveText('Content');
  });

  it('does not show an element when none of the user`s roles matches any of the roles required on the element', () => {
    currentUser$.next({
      privilege: {
        roles: {
          $set: [Role.DatasetRead, Role.DatasetWrite],
        },
      },
    } as LoggedInUser);

    spectator = createHost(
      '<div *ixHasRoles="[Role.Readonly]">Content</div>',
      {
        hostProps: { Role },
      },
    );

    expect(spectator.query('div')).not.toExist();
  });
});
