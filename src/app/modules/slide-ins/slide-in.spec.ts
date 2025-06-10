import { Overlay, OverlayPositionBuilder, OverlayRef } from '@angular/cdk/overlay';
import { ComponentRef, Injector, ValueProvider } from '@angular/core';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
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
    expect(containerRefMock.instance.attachPortal).toHaveBeenCalledWith(
      expect.objectContaining({
        component: MockSlideIn2Component,
      }),
    );
    expect(overlayRefMock.dispose).toHaveBeenCalled();
    expect(spectator.service.openSlideIns()).toBe(0);
  });
});
