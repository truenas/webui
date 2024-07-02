import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { LazyLoadImageDirective, LazyLoadImageModule } from 'ng-lazyload-image';
import { AppCardLogoComponent } from 'app/pages/apps/components/app-card-logo/app-card-logo.component';

describe('AppCardLogoComponent', () => {
  let spectator: Spectator<AppCardLogoComponent>;

  const createComponent = createComponentFactory({
    component: AppCardLogoComponent,
    imports: [LazyLoadImageModule],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        url: 'https://www.seti.org/logo.png',
      },
    });
  });

  it('shows app logo', () => {
    expect(spectator.query(LazyLoadImageDirective).lazyImage).toBe('https://www.seti.org/logo.png');
  });
});
