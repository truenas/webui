import { createHostFactory, mockProvider, SpectatorHost } from '@ngneat/spectator/jest';
import { BehaviorSubject } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { AuthService } from 'app/modules/auth/auth.service';

describe('RequiresRolesDirective', () => {
  let spectator: SpectatorHost<RequiresRolesDirective, { roles: Role[] }>;
  const hasRole$ = new BehaviorSubject(true);

  const createDirective = createHostFactory({
    component: RequiresRolesDirective,
    providers: [
      mockProvider(AuthService, {
        hasRole: jest.fn(() => hasRole$),
      }),
    ],
  });

  function render(roles: Role[]): HTMLElement {
    spectator = createDirective('<div id="test" *ixRequiresRoles="roles"></div>', {
      hostProps: { roles },
    });
    return spectator.fixture.nativeElement as HTMLElement;
  }

  it('shows the element without asking about roles when none are required', () => {
    const element = render([]);

    expect(element.firstElementChild).toHaveId('test');
    expect(spectator.inject(AuthService).hasRole).not.toHaveBeenCalled();
  });

  it('shows the element when the user has the roles', () => {
    hasRole$.next(true);
    const element = render([Role.SharingSmbWrite]);

    expect(spectator.inject(AuthService).hasRole).toHaveBeenCalledWith([Role.SharingSmbWrite]);
    expect(element.children).toHaveLength(1);
    expect(element.firstElementChild).toHaveId('test');
  });

  it('wraps the element in the missing access wrapper when the user lacks the roles', () => {
    hasRole$.next(false);
    const element = render([Role.SharingSmbWrite]);

    expect(element.children).toHaveLength(1);
    expect(element.firstElementChild!.tagName).toBe('IX-MISSING-ACCESS-WRAPPER');
    expect(element.querySelector('#test')).not.toBeNull();
  });
});
