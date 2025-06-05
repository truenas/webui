import { CdkPortalOutlet, ComponentPortal } from '@angular/cdk/portal';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { SlideInContainerComponent } from 'app/modules/slide-ins/components/slide-in-container/slide-in-container.component';
import { MockSlideInComponent } from 'app/modules/slide-ins/test-utils/mock-slide-in.component';

describe('SlideInContainerComponent', () => {
  let spectator: Spectator<SlideInContainerComponent>;
  let mockPortalOutlet: Pick<CdkPortalOutlet, 'attach' | 'detach'>;

  const createComponent = createComponentFactory({
    component: SlideInContainerComponent,
  });

  beforeEach(() => {
    spectator = createComponent();
    mockPortalOutlet = {
      attach: jest.fn(),
      detach: jest.fn(),
    };
    Object.defineProperty(spectator.component, 'portalOutlet', {
      value: mockPortalOutlet,
    });
  });

  it('should emit whenVisible$ on slideIn', () => {
    spectator.component.slideIn().subscribe(() => {
      expect(true).toBe(true);
      return Promise.resolve();
    });

    const hostElement = spectator.fixture.nativeElement as HTMLElement;

    hostElement.dispatchEvent(new CustomEvent('@slideInOut.done', {
      detail: { toState: 'visible' },
    }));
    spectator.detectChanges();
  });

  it('should emit whenHidden$ on slideOut', () => {
    spectator.component.slideOut().subscribe(() => {
      expect(true).toBe(true);
      return Promise.resolve();
    });

    const hostElement = spectator.fixture.nativeElement as HTMLElement;

    hostElement.dispatchEvent(new CustomEvent('@slideInOut.done', {
      detail: { toState: 'hidden' },
    }));
    spectator.detectChanges();
  });

  it('should set width and max-width to 800px when makeWide(true) is called', () => {
    const hostEl = spectator.fixture.nativeElement as HTMLElement;
    expect(hostEl.style.width).toBe('480px');
    expect(hostEl.style.maxWidth).toBe('480px');
    spectator.component.makeWide(true);
    spectator.detectChanges();

    expect(hostEl.style.width).toBe('800px');
    expect(hostEl.style.maxWidth).toBe('800px');
  });

  it('should call attach on portalOutlet when attachPortal is called', () => {
    const portal = new ComponentPortal(MockSlideInComponent);
    spectator.component.attachPortal(portal);

    expect(mockPortalOutlet.attach).toHaveBeenCalledWith(portal);
  });

  it('should call detach on portalOutlet when detachPortal is called', () => {
    spectator.component.detachPortal();

    expect(mockPortalOutlet.detach).toHaveBeenCalled();
  });
});
