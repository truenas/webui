import { AsyncPipe } from '@angular/common';
import { createPipeFactory, mockProvider, SpectatorPipe } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { HasRolesPipe } from 'app/directives/requires-roles/has-roles.pipe';
import { Role } from 'app/enums/role.enum';
import { AuthService } from 'app/modules/auth/auth.service';

describe('HasRolesPipe', () => {
  let spectator: SpectatorPipe<HasRolesPipe>;
  const createPipe = createPipeFactory({
    pipe: HasRolesPipe,
    imports: [AsyncPipe],
    providers: [
      mockProvider(AuthService, {
        hasRole: jest.fn((roles: Role[]) => of(roles.includes(Role.ReadonlyAdmin))),
      }),
    ],
  });

  it('answers true for no roles without asking AuthService', () => {
    spectator = createPipe('{{ ([] | hasRoles | async) }}');
    expect(spectator.element).toHaveText('true');
    expect(spectator.inject(AuthService).hasRole).not.toHaveBeenCalled();
  });

  it('answers false when the user holds none of the roles', () => {
    spectator = createPipe('{{ (roles | hasRoles | async) }}', {
      hostProps: { roles: [Role.FullAdmin] },
    });
    expect(spectator.element).toHaveText('false');
    expect(spectator.inject(AuthService).hasRole).toHaveBeenCalledWith([Role.FullAdmin]);
  });

  it('answers true when the user holds any one of the roles', () => {
    spectator = createPipe('{{ (roles | hasRoles | async) }}', {
      hostProps: { roles: [Role.FullAdmin, Role.ReadonlyAdmin] },
    });
    expect(spectator.element).toHaveText('true');
  });
});
