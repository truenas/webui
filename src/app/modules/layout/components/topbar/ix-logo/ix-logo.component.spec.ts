import { MediaObserver } from '@angular/flex-layout';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { IxLogoComponent } from 'app/modules/layout/components/topbar/ix-logo/ix-logo.component';
import { ThemeService } from 'app/services/theme/theme.service';

describe('IxLogoComponent', () => {
  let spectator: Spectator<IxLogoComponent>;
  const createComponent = createComponentFactory({
    component: IxLogoComponent,
    declarations: [
      MockComponent(IxIconComponent),
    ],
    providers: [
      mockProvider(ThemeService, {
        activeTheme$: of('ix-dark'),
      }),
      mockProvider(MediaObserver, {
        asObservable: () => of([{
          mqAlias: 'sm',
        }]),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows a logo that takes user to ixsystems website', () => {
    expect(spectator.query('a')).toHaveAttribute('href', 'https://www.ixsystems.com');
    const icon = spectator.query(IxIconComponent);
    expect(icon.name).toBe('ix:logo_full_rgb');
  });
});
