import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { LazyLoadImageDirective, LazyLoadImageModule } from 'ng-lazyload-image';
import { AppCardLogoComponent } from 'app/pages/apps/components/app-card-logo/app-card-logo.component';
import { LayoutService } from 'app/services/layout.service';

describe('AppCardLogoComponent', () => {
  let spectator: Spectator<AppCardLogoComponent>;

  const createComponent = createComponentFactory({
    component: AppCardLogoComponent,
    imports: [LazyLoadImageModule],
    providers: [
      mockProvider(LayoutService, {
        getContentContainer: jest.fn(() => document.createElement('div')),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        url: 'https://www.seti.org/logo.png',
      },
    });
  });

  it('shows default image', () => {
    expect(spectator.query('img')).toHaveAttribute('src', 'assets/images/truenas_scale_ondark_favicon.png');
  });

  it('shows app logo', () => {
    expect(spectator.query(LazyLoadImageDirective).lazyImage).toBe('https://www.seti.org/logo.png');
  });
});
