import {
  createHostFactory, mockProvider, SpectatorHost,
} from '@ngneat/spectator/jest';
import { BehaviorSubject } from 'rxjs';
import { HasRoleDirective } from 'app/directives/has-role/has-role.directive';
import { Role } from 'app/enums/role.enum';
import { AuthService } from 'app/modules/auth/auth.service';

describe('HasRolesDirective', () => {
  let spectator: SpectatorHost<HasRoleDirective>;
  const hasRole$ = new BehaviorSubject(false);

  const createHost = createHostFactory({
    component: HasRoleDirective,
    providers: [
      mockProvider(AuthService, {
        hasRole: jest.fn(() => hasRole$),
      }),
    ],
  });

  beforeEach(() => {
    hasRole$.next(false);
  });

  it('does not show an element when user doe not have correct roles', () => {
    spectator = createHost(
      '<div *ixHasRole="[Role.ReadonlyAdmin]">Content</div>',
      {
        hostProps: { Role },
      },
    );

    const authService = spectator.inject(AuthService);

    expect(authService.hasRole).toHaveBeenCalledWith([Role.ReadonlyAdmin]);
    expect(spectator.query('div')).not.toExist();
  });

  it('shows an element when user has correct roles', () => {
    hasRole$.next(true);
    spectator = createHost(
      '<div *ixHasRole="[Role.NetworkInterfaceWrite]">Content</div>',
      {
        hostProps: { Role },
      },
    );

    const authService = spectator.inject(AuthService);

    expect(authService.hasRole).toHaveBeenCalledWith([Role.NetworkInterfaceWrite]);
    expect(spectator.query('div')).toExist();
  });

  it('changes from not showing an element to showing, when user changes', () => {
    spectator = createHost(
      '<div *ixHasRole="[Role.NetworkInterfaceWrite]">Content</div>',
      {
        hostProps: { Role },
      },
    );

    expect(spectator.query('div')).not.toExist();

    hasRole$.next(true);
    expect(spectator.query('div')).toExist();
  });
});
