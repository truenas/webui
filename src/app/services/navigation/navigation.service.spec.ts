import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from 'app/modules/auth/auth.service';
import { NavigationService } from 'app/services/navigation/navigation.service';
import { LicenseService } from 'app/services/license.service';

describe('NavigationService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NavigationService,
        {
          provide: AuthService,
          useValue: {
            user$: of({ privilege: { web_shell: true } }),
          },
        },
        {
          provide: LicenseService,
          useValue: {
            hasApps$: of(true),
            hasEnclosure$: of(true),
            hasKmip$: of(true),
            hasVms$: of(true),
          },
        },
      ],
    });
  });

  it('does not expose Harbor Assistant in visible menu items', () => {
    const service = TestBed.inject(NavigationService);

    expect(service.menuItems.map((item) => item.state)).not.toContain('harbor-assistant');
  });
});
