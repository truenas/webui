import { createHostFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Role } from 'app/enums/role.enum';
import { AuthService } from 'app/services/auth/auth.service';
import { HasRolesDirective } from './has-roles.directive';

describe('HasRolesDirective', () => {
  let spectator: Spectator<HasRolesDirective>;

  const createHost = createHostFactory({
    component: HasRolesDirective,
    providers: [
      mockProvider(AuthService),
    ],
  });

  it('does not show an element when user doe not have correct roles', () => {
    spectator = createHost(
      '<div *ixHasRoles="[Role.Readonly]">Content</div>',
      {
        hostProps: { Role },
        providers: [
          mockProvider(AuthService, {
            hasRole: jest.fn(() => false),
          }),
        ],
      },
    );

    const authService = spectator.inject(AuthService);

    expect(authService.hasRole).toHaveBeenCalledWith([Role.Readonly]);
    expect(spectator.query('div')).not.toExist();
  });

  it('shows an element when user has correct roles', () => {
    spectator = createHost(
      '<div *ixHasRoles="[Role.NetworkInterfaceWrite]">Content</div>',
      {
        hostProps: { Role },
        providers: [
          mockProvider(AuthService, {
            hasRole: jest.fn(() => true),
          }),
        ],
      },
    );

    const authService = spectator.inject(AuthService);

    expect(authService.hasRole).toHaveBeenCalledWith([Role.NetworkInterfaceWrite]);
    expect(spectator.query('div')).toExist();
  });
});
