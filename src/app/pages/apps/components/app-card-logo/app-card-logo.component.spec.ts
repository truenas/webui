import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { LazyLoadImageDirective, LazyLoadImageModule } from 'ng-lazyload-image';
import { LayoutService } from 'app/modules/layout/layout.service';
import { AppCardLogoComponent } from 'app/pages/apps/components/app-card-logo/app-card-logo.component';

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

  beforeAll(() => {
    global.IntersectionObserver = class IntersectionObserver {
      observe(): void { jest.fn(); }
      unobserve(): void { jest.fn(); }
      disconnect(): void { jest.fn(); }
    } as unknown as {
      new (callback: IntersectionObserverCallback, options?: IntersectionObserverInit): IntersectionObserver;
      prototype: IntersectionObserver;
    };
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        url: 'https://www.seti.org/logo.png',
      },
    });
  });

  it('shows default image', () => {
    expect(spectator.query('img')).toHaveAttribute('src', 'assets/images/truenas_ondark_favicon.png');
  });

  it('shows app logo', () => {
    expect(spectator.query(LazyLoadImageDirective)!.lazyImage).toBe('https://www.seti.org/logo.png');
  });
});
