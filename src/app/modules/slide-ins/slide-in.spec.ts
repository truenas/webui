import { Overlay, OverlayPositionBuilder, OverlayRef } from '@angular/cdk/overlay';
import { ComponentRef, Injector, ValueProvider } from '@angular/core';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { environment } from 'environments/environment';
import { of, Subject } from 'rxjs';
import { SlideInContainerComponent } from 'app/modules/slide-ins/components/slide-in-container/slide-in-container.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { MockSlideInComponent } from 'app/modules/slide-ins/test-utils/mock-slide-in.component';
import { MockSlideIn2Component } from 'app/modules/slide-ins/test-utils/mock-slide-in2.component';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';

describe('SlideIn Service', () => {
  let spectator: SpectatorService<SlideIn>;
  let attachSpy: jest.Mock;
  let overlayRefMock: Partial<OverlayRef>;
  let containerRefMock: Partial<ComponentRef<SlideInContainerComponent>>;
  const whenVisible$ = new Subject<void>();
  const whenHidden$ = new Subject<void>();

  const createService = createServiceFactory({
    service: SlideIn,
    providers: [
      mockProvider(UnsavedChangesService, {
        showConfirmDialog: jest.fn(() => of(true)),
      }),
      mockProvider(Overlay),
      mockProvider(Injector),
      mockProvider(Store, {
        selectSignal: jest.fn(() => () => false),
      }),
    ],
    declarations: [SlideInContainerComponent],
  });

  beforeEach(() => {
    containerRefMock = {
      instance: {
        detachPortal: jest.fn(),
        makeWide: jest.fn(),
        attachPortal: jest.fn(),
        slideIn: jest.fn(() => whenVisible$.asObservable()),
        slideOut: jest.fn(() => whenHidden$.asObservable()),
      } as unknown as SlideInContainerComponent,
    };

    attachSpy = jest.fn(() => containerRefMock);
    overlayRefMock = {
      attach: attachSpy,
      dispose: jest.fn(),
      backdropClick: () => of(undefined),
    };

    spectator = createService();
    const overlay = spectator.inject(Overlay);
    jest.spyOn(overlay, 'create').mockReturnValue(overlayRefMock as OverlayRef);
    jest.spyOn(overlay, 'position').mockImplementation(() => ({
      global: () => ({ top: () => ({ right: () => ({}) }) }),
    }) as OverlayPositionBuilder);
  });

  it('should open SlideInContainerComponent and render MockSlideInComponent inside it', () => {
    spectator.service.open(MockSlideInComponent).subscribe({
      complete: () => {
        expect(overlayRefMock.dispose).toHaveBeenCalled();
      },
    });

    expect(attachSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        component: SlideInContainerComponent,
      }),
    );
    expect(containerRefMock.instance.attachPortal).toHaveBeenCalledWith(
      expect.objectContaining({
        component: MockSlideInComponent,
      }),
    );
  });

  // eslint-disable-next-line jest/no-done-callback
  it('should close slide-in when close method is called', (done) => {
    const injectorCreateSpy = jest.spyOn(Injector, 'create');
    spectator.service.open(MockSlideInComponent).subscribe({
      next: (response) => {
        try {
          expect(response.response).toBe('test');

          done();
        } catch (err) {
          done(err);
        }
      },
    });
    const injectorArgs = injectorCreateSpy.mock.calls[0][0];
    const slideInRef = (
      (injectorArgs.providers.find(
        (provider: ValueProvider) => provider.provide === SlideInRef,
      )
      ) as ValueProvider
    ).useValue as SlideInRef<unknown, unknown>;
    slideInRef.close({ response: 'test' });
    whenHidden$.next();
    whenVisible$.next();
    expect(overlayRefMock.dispose).toHaveBeenCalled();
    expect(spectator.service.openSlideIns()).toBe(0);
  });

  // eslint-disable-next-line jest/no-done-callback
  it('should swap slide-in when swap method is called and respond to the same observable', (done) => {
    const injectorCreateSpy = jest.spyOn(Injector, 'create');
    spectator.service.open(MockSlideInComponent).subscribe({
      next: (response) => {
        try {
          expect(response.response).toBe('test2');

          done();
        } catch (err) {
          done(err);
        }
      },
    });
    const injectorArgs = injectorCreateSpy.mock.calls[0][0];
    const slideInRef = (
      (injectorArgs.providers.find(
        (provider: ValueProvider) => provider.provide === SlideInRef,
      )
      ) as ValueProvider
    ).useValue as SlideInRef<unknown, unknown>;
    slideInRef.swap(MockSlideIn2Component);
    expect(spectator.service.openSlideIns()).toBe(1);
    slideInRef.close({ response: 'test2' });
    whenHidden$.next();
    whenVisible$.next();
    expect(containerRefMock.instance.attachPortal).toHaveBeenCalled();
    expect(overlayRefMock.dispose).toHaveBeenCalled();
    expect(spectator.service.openSlideIns()).toBe(0);
  });

  describe('debug panel integration', () => {
    let originalDebugPanel: typeof environment.debugPanel;
    let store$: Store;
    let selectSignalSpy: jest.Mock;

    beforeEach(() => {
      originalDebugPanel = environment.debugPanel;
      store$ = spectator.inject(Store);
      selectSignalSpy = store$.selectSignal as jest.Mock;
    });

    afterEach(() => {
      environment.debugPanel = originalDebugPanel;
    });

    it('should not call selectIsPanelOpen when debug panel is disabled', () => {
      environment.debugPanel = { enabled: false } as typeof environment.debugPanel;
      selectSignalSpy.mockClear();

      spectator.service.open(MockSlideInComponent);

      expect(selectSignalSpy).not.toHaveBeenCalled();
    });

    it('should call selectIsPanelOpen when debug panel is enabled', () => {
      environment.debugPanel = { enabled: true } as typeof environment.debugPanel;
      selectSignalSpy.mockClear();
      selectSignalSpy.mockReturnValue(() => false);

      spectator.service.open(MockSlideInComponent);

      expect(selectSignalSpy).toHaveBeenCalled();
    });

    it('should apply debug panel offset when panel is open', () => {
      environment.debugPanel = { enabled: true } as typeof environment.debugPanel;
      selectSignalSpy.mockReturnValue(() => true);

      const mockDebugPanelWidth = '600px';
      // Mock getComputedStyle globally for this test
      jest.spyOn(globalThis, 'getComputedStyle').mockImplementation(() => ({
        getPropertyValue: (prop: string) => (prop === '--debug-panel-width' ? mockDebugPanelWidth : ''),
      }) as CSSStyleDeclaration);

      const overlay = spectator.inject(Overlay);
      const rightSpy = jest.fn();
      const topSpy = jest.fn(() => ({ right: rightSpy }));
      const globalSpy = jest.fn(() => ({ top: topSpy }));
      jest.spyOn(overlay, 'position').mockImplementation(() => ({
        global: globalSpy,
      }) as unknown as OverlayPositionBuilder);

      spectator.service.open(MockSlideInComponent);

      expect(globalSpy).toHaveBeenCalled();
      expect(topSpy).toHaveBeenCalledWith('48px');
      expect(rightSpy).toHaveBeenCalledWith(mockDebugPanelWidth);
    });

    it('should use default position when debug panel is closed', () => {
      environment.debugPanel = { enabled: true } as typeof environment.debugPanel;
      selectSignalSpy.mockReturnValue(() => false);

      const overlay = spectator.inject(Overlay);
      const rightSpy = jest.fn();
      const topSpy = jest.fn(() => ({ right: rightSpy }));
      const globalSpy = jest.fn(() => ({ top: topSpy }));
      jest.spyOn(overlay, 'position').mockImplementation(() => ({
        global: globalSpy,
      }) as unknown as OverlayPositionBuilder);

      spectator.service.open(MockSlideInComponent);

      expect(globalSpy).toHaveBeenCalled();
      expect(topSpy).toHaveBeenCalledWith('48px');
      expect(rightSpy).toHaveBeenCalledWith('0');
    });
  });
});
