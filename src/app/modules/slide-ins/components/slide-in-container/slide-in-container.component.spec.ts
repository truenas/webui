import { CdkPortalOutlet, ComponentPortal } from '@angular/cdk/portal';
import { fakeAsync, tick } from '@angular/core/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { WINDOW } from 'app/helpers/window.helper';
import { SlideInContainerComponent } from 'app/modules/slide-ins/components/slide-in-container/slide-in-container.component';
import { MockSlideInComponent } from 'app/modules/slide-ins/test-utils/mock-slide-in.component';
import { FocusService } from 'app/services/focus.service';

describe('SlideInContainerComponent', () => {
  let spectator: Spectator<SlideInContainerComponent>;
  let mockPortalOutlet: Pick<CdkPortalOutlet, 'attach' | 'detach'>;
  let mockWindow: Partial<Window>;

  // Mock TransitionEvent for jsdom
  class MockTransitionEvent extends Event {
    propertyName: string;
    constructor(type: string, init?: { propertyName?: string }) {
      super(type);
      this.propertyName = init?.propertyName || '';
    }
  }

  const createComponent = createComponentFactory({
    component: SlideInContainerComponent,
    providers: [
      {
        provide: WINDOW,
        useValue: {
          innerWidth: 1024,
        },
      },
      mockProvider(FocusService, {
        focusFirstFocusableElement: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    // Mock requestAnimationFrame to execute immediately
    jest.spyOn(global, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 0;
    });

    spectator = createComponent();
    mockWindow = spectator.inject<Window>(WINDOW);

    mockPortalOutlet = {
      attach: jest.fn(),
      detach: jest.fn(),
    };
    Object.defineProperty(spectator.component, 'portalOutlet', {
      value: mockPortalOutlet,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should start with hidden state', () => {
      const hostElement = spectator.fixture.nativeElement as HTMLElement;
      expect(hostElement.classList.contains('slide-in-hidden')).toBe(true);
      expect(hostElement.classList.contains('slide-in-visible')).toBe(false);
    });

    it('should set initial width to 480px', () => {
      const hostElement = spectator.fixture.nativeElement as HTMLElement;
      expect(hostElement.style.width).toBe('480px');
      expect(hostElement.style.maxWidth).toBe('480px');
    });

    it('should trigger slideIn after initialization', fakeAsync(() => {
      const slideInSpy = jest.spyOn(spectator.component, 'slideIn');
      spectator.component.ngAfterViewInit();
      tick();
      expect(slideInSpy).toHaveBeenCalled();
    }));
  });

  describe('slideIn', () => {
    it('should set visible state and remove hidden state', () => {
      const hostElement = spectator.fixture.nativeElement as HTMLElement;
      spectator.component.slideIn();
      spectator.detectChanges();

      expect(hostElement.classList.contains('slide-in-visible')).toBe(true);
      expect(hostElement.classList.contains('slide-in-hidden')).toBe(false);
    });

    it('should return observable that completes with timeout fallback', fakeAsync(() => {
      let completed = false;
      spectator.component.slideIn().subscribe({
        complete: () => { completed = true; },
      });

      // Simulate timeout without transition event
      tick(300);
      expect(completed).toBe(true);
    }));

    it('should emit whenVisible$ on transitionend', () => {
      let emitted = false;
      spectator.component.slideIn().subscribe(() => {
        emitted = true;
      });

      const hostElement = spectator.fixture.nativeElement as HTMLElement;
      const event = new MockTransitionEvent('transitionend', {
        propertyName: 'transform',
      });
      Object.defineProperty(event, 'target', { value: hostElement });
      Object.defineProperty(event, 'currentTarget', { value: hostElement });

      spectator.component.slideIn();
      spectator.detectChanges();
      hostElement.dispatchEvent(event);

      expect(emitted).toBe(true);
    });
  });

  describe('slideOut', () => {
    it('should set hidden state and remove visible state', () => {
      const hostElement = spectator.fixture.nativeElement as HTMLElement;

      // First make it visible
      spectator.component.slideIn();
      spectator.detectChanges();

      // Then slide out
      spectator.component.slideOut();
      spectator.detectChanges();

      expect(hostElement.classList.contains('slide-in-hidden')).toBe(true);
      expect(hostElement.classList.contains('slide-in-visible')).toBe(false);
    });

    it('should return observable that completes with timeout fallback', fakeAsync(() => {
      let completed = false;
      spectator.component.slideOut().subscribe({
        complete: () => { completed = true; },
      });

      // Simulate timeout without transition event
      tick(300);
      expect(completed).toBe(true);
    }));

    it('should emit whenHidden$ on transitionend', () => {
      let emitted = false;
      spectator.component.slideOut().subscribe(() => {
        emitted = true;
      });

      const hostElement = spectator.fixture.nativeElement as HTMLElement;
      const event = new MockTransitionEvent('transitionend', {
        propertyName: 'transform',
      });
      Object.defineProperty(event, 'target', { value: hostElement });
      Object.defineProperty(event, 'currentTarget', { value: hostElement });

      spectator.component.slideOut();
      spectator.detectChanges();
      hostElement.dispatchEvent(event);

      expect(emitted).toBe(true);
    });
  });

  describe('transitionend handling', () => {
    it('should ignore transitionend events from child elements', () => {
      let emitted = false;
      spectator.component.slideIn().subscribe(() => {
        emitted = true;
      });

      const hostElement = spectator.fixture.nativeElement as HTMLElement;
      const childElement = document.createElement('div');
      const event = new MockTransitionEvent('transitionend', {
        propertyName: 'transform',
      });
      Object.defineProperty(event, 'target', { value: childElement });
      Object.defineProperty(event, 'currentTarget', { value: hostElement });

      spectator.component.slideIn();
      spectator.detectChanges();
      hostElement.dispatchEvent(event);

      expect(emitted).toBe(false);
    });

    it('should ignore transitionend events for non-transform properties', () => {
      let emitted = false;
      spectator.component.slideIn().subscribe(() => {
        emitted = true;
      });

      const hostElement = spectator.fixture.nativeElement as HTMLElement;
      const event = new MockTransitionEvent('transitionend', {
        propertyName: 'opacity',
      });
      Object.defineProperty(event, 'target', { value: hostElement });
      Object.defineProperty(event, 'currentTarget', { value: hostElement });

      spectator.component.slideIn();
      spectator.detectChanges();
      hostElement.dispatchEvent(event);

      expect(emitted).toBe(false);
    });

    it('should not emit if state mismatch on visible transition', () => {
      let emitted = false;
      const component = spectator.component as unknown as {
        whenVisible$: { subscribe: (fn: () => void) => void };
        isVisible: boolean;
        isHidden: boolean;
      };
      component.whenVisible$.subscribe(() => {
        emitted = true;
      });

      const hostElement = spectator.fixture.nativeElement as HTMLElement;
      const event = new MockTransitionEvent('transitionend', {
        propertyName: 'transform',
      });
      Object.defineProperty(event, 'target', { value: hostElement });
      Object.defineProperty(event, 'currentTarget', { value: hostElement });

      // Component is in hidden state, but event suggests visible transition
      component.isVisible = true;
      component.isHidden = true; // Contradictory state
      hostElement.dispatchEvent(event);

      expect(emitted).toBe(false);
    });

    it('should not emit if state mismatch on hidden transition', () => {
      let emitted = false;
      const component = spectator.component as unknown as {
        whenHidden$: { subscribe: (fn: () => void) => void };
        isVisible: boolean;
        isHidden: boolean;
      };
      component.whenHidden$.subscribe(() => {
        emitted = true;
      });

      const hostElement = spectator.fixture.nativeElement as HTMLElement;
      const event = new MockTransitionEvent('transitionend', {
        propertyName: 'transform',
      });
      Object.defineProperty(event, 'target', { value: hostElement });
      Object.defineProperty(event, 'currentTarget', { value: hostElement });

      // Component is in visible state, but event suggests hidden transition
      component.isHidden = true;
      component.isVisible = true; // Contradictory state
      hostElement.dispatchEvent(event);

      expect(emitted).toBe(false);
    });
  });

  describe('makeWide', () => {
    it('should set width to 800px when makeWide(true)', () => {
      const hostElement = spectator.fixture.nativeElement as HTMLElement;
      spectator.component.makeWide(true);
      spectator.detectChanges();

      expect(hostElement.style.width).toBe('800px');
      expect(hostElement.style.maxWidth).toBe('800px');
    });

    it('should set width to 480px when makeWide(false)', () => {
      const hostElement = spectator.fixture.nativeElement as HTMLElement;

      // First make it wide
      spectator.component.makeWide(true);
      spectator.detectChanges();

      // Then make it normal
      spectator.component.makeWide(false);
      spectator.detectChanges();

      expect(hostElement.style.width).toBe('480px');
      expect(hostElement.style.maxWidth).toBe('480px');
    });

    it('should set width to 100vw when window is narrower than base width', () => {
      const hostElement = spectator.fixture.nativeElement as HTMLElement;

      // Mock narrow window
      (mockWindow as { innerWidth: number }).innerWidth = 400;
      spectator.component.makeWide(false);
      spectator.detectChanges();

      expect(hostElement.style.width).toBe('100vw');
      expect(hostElement.style.maxWidth).toBe('100vw');
    });

    it('should set width to 100vw when window is narrower than wide width', () => {
      const hostElement = spectator.fixture.nativeElement as HTMLElement;

      // Mock medium window
      (mockWindow as { innerWidth: number }).innerWidth = 700;
      spectator.component.makeWide(true);
      spectator.detectChanges();

      expect(hostElement.style.width).toBe('100vw');
      expect(hostElement.style.maxWidth).toBe('100vw');
    });
  });

  describe('window resize', () => {
    it('should update width on window resize', fakeAsync(() => {
      const hostElement = spectator.fixture.nativeElement as HTMLElement;

      // Start with wide window
      (mockWindow as { innerWidth: number }).innerWidth = 1024;
      spectator.component.makeWide(false);
      spectator.detectChanges();
      expect(hostElement.style.width).toBe('480px');

      // Resize to narrow window
      (mockWindow as { innerWidth: number }).innerWidth = 400;
      (spectator.component as unknown as { onResize: () => void }).onResize();
      tick(100); // Debounce time
      spectator.detectChanges();

      expect(hostElement.style.width).toBe('100vw');
    }));

    it('should debounce resize events', fakeAsync(() => {
      const component = spectator.component as unknown as { updateWidth: () => void };
      const updateWidthSpy = jest.spyOn(component, 'updateWidth');

      // Trigger multiple resize events
      (spectator.component as unknown as { onResize: () => void }).onResize();
      tick(50);
      (spectator.component as unknown as { onResize: () => void }).onResize();
      tick(50);
      (spectator.component as unknown as { onResize: () => void }).onResize();
      tick(100); // Total 200ms, debounce is 100ms

      // Should only be called once due to debounce
      expect(updateWidthSpy).toHaveBeenCalledTimes(1);
    }));
  });

  describe('portal management', () => {
    it('should attach portal', () => {
      const portal = new ComponentPortal(MockSlideInComponent);
      spectator.component.attachPortal(portal);

      expect(mockPortalOutlet.attach).toHaveBeenCalledWith(portal);
    });

    it('should detach portal', () => {
      spectator.component.detachPortal();

      expect(mockPortalOutlet.detach).toHaveBeenCalled();
    });
  });

  describe('change detection', () => {
    it('should mark for check on slideIn', () => {
      const component = spectator.component as unknown as { cdr: { markForCheck: () => void } };
      const cdrSpy = jest.spyOn(component.cdr, 'markForCheck');
      spectator.component.slideIn();
      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should mark for check on slideOut', () => {
      const component = spectator.component as unknown as { cdr: { markForCheck: () => void } };
      const cdrSpy = jest.spyOn(component.cdr, 'markForCheck');
      spectator.component.slideOut();
      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should mark for check on width update', () => {
      const component = spectator.component as unknown as { cdr: { markForCheck: () => void } };
      const cdrSpy = jest.spyOn(component.cdr, 'markForCheck');
      spectator.component.makeWide(true);
      expect(cdrSpy).toHaveBeenCalled();
    });
  });

  describe('keyboard handling', () => {
    it('should close slide-in when Escape key is pressed', fakeAsync(() => {
      const mockSlideInRef = {
        close: jest.fn(),
      };
      (spectator.component as unknown as { slideInRef: typeof mockSlideInRef }).slideInRef = mockSlideInRef;

      spectator.component.slideIn();
      tick(300); // Wait for transition timeout

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);
      tick();

      expect(mockSlideInRef.close).toHaveBeenCalledWith({ response: false, error: undefined });
    }));

    it('should not close slide-in when other keys are pressed', fakeAsync(() => {
      const mockSlideInRef = {
        close: jest.fn(),
      };
      (spectator.component as unknown as { slideInRef: typeof mockSlideInRef }).slideInRef = mockSlideInRef;

      spectator.component.slideIn();
      tick(300);

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(enterEvent);
      tick();

      expect(mockSlideInRef.close).not.toHaveBeenCalled();
    }));

    it('should remove keydown listener when sliding out', fakeAsync(() => {
      const mockSlideInRef = {
        close: jest.fn(),
      };
      (spectator.component as unknown as { slideInRef: typeof mockSlideInRef }).slideInRef = mockSlideInRef;

      spectator.component.slideIn();
      tick(300);
      spectator.component.slideOut();
      tick(300);

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);
      tick();

      expect(mockSlideInRef.close).not.toHaveBeenCalled();
    }));

    it('should not crash if slideInRef is not set when Escape is pressed', fakeAsync(() => {
      spectator.component.slideIn();
      tick(300);

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      expect(() => {
        document.dispatchEvent(escapeEvent);
        tick();
      }).not.toThrow();
    }));

    it('should not close slide-in when event is defaultPrevented (e.g., global search handled it)', fakeAsync(() => {
      const mockSlideInRef = {
        close: jest.fn(),
      };
      (spectator.component as unknown as { slideInRef: typeof mockSlideInRef }).slideInRef = mockSlideInRef;

      spectator.component.slideIn();
      tick(300);

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
      escapeEvent.preventDefault();
      document.dispatchEvent(escapeEvent);
      tick();

      expect(mockSlideInRef.close).not.toHaveBeenCalled();
    }));
  });

  describe('focus management', () => {
    it('should focus close button if available', fakeAsync(() => {
      const closeButton = document.createElement('button');
      closeButton.id = 'ix-close-icon';
      spectator.element.appendChild(closeButton);

      const focusSpy = jest.spyOn(closeButton, 'focus');

      spectator.component.slideIn();
      tick(300);

      expect(focusSpy).toHaveBeenCalled();

      spectator.element.removeChild(closeButton);
    }));

    it('should focus first focusable element if close button is not available', fakeAsync(() => {
      const focusService = spectator.inject(FocusService);
      const focusSpy = jest.spyOn(focusService, 'focusFirstFocusableElement');

      spectator.component.slideIn();
      tick(300);

      expect(focusSpy).toHaveBeenCalled();
    }));
  });
});
