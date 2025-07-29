import {
  Overlay,
  OverlayConfig,
  OverlayRef,
} from '@angular/cdk/overlay';
import {
  ComponentPortal,
} from '@angular/cdk/portal';
import {
  ComponentRef,
  computed,
  Injectable,
  Injector,
  signal,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { UUID } from 'angular2-uuid';
import { environment } from 'environments/environment';
import { cloneDeep } from 'lodash-es';
import {
  delay,
  filter, Observable, of, share, Subject, switchMap,
  take,
  tap,
} from 'rxjs';
import { SlideInContainerComponent } from 'app/modules/slide-ins/components/slide-in-container/slide-in-container.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ComponentInSlideIn, SlideInInstance, SlideInResponse } from 'app/modules/slide-ins/slide-in.interface';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';
import { selectIsPanelOpen } from 'app/modules/websocket-debug-panel/store/websocket-debug.selectors';
import { AppState } from 'app/store';

@UntilDestroy()
// eslint-disable-next-line angular-file-naming/service-filename-suffix
@Injectable({ providedIn: 'root' })
export class SlideIn {
  private slideInInstances = signal<SlideInInstance<unknown, unknown>[]>([]);
  readonly openSlideIns = computed(() => this.slideInInstances()?.length);

  constructor(
    private cdkOverlay: Overlay,
    private injector: Injector,
    private unsavedChangesService: UnsavedChangesService,
    private store$: Store<AppState>,
  ) {}

  // TODO: Refactor this -> https://github.com/truenas/webui/pull/12168#pullrequestreview-2949579034
  closeAll(): void {
    const instances = [...this.slideInInstances()].reverse();

    for (const instance of instances) {
      instance.slideInRef.requireConfirmationWhen(undefined);
      instance.cdkOverlayRef.dispose();
      instance.slideInRef.close({ response: false, error: undefined });
    }

    this.slideInInstances.set([]);
  }

  open<D, R>(
    component: ComponentInSlideIn<D, R>,
    options: { data?: D; wide?: boolean } = {},
  ): Observable<SlideInResponse<R>> {
    const open$ = this.animateOutTopComponent().pipe(
      switchMap(() => {
        const slideInId = UUID.UUID();

        const cdkOverlayRef = this.cdkOverlay.create(this.getOverlayConfig());
        const containerPortal = new ComponentPortal(SlideInContainerComponent);
        const containerRef = cdkOverlayRef.attach(containerPortal);

        const close$ = this.getCloseSubject<SlideInResponse<R>>(cdkOverlayRef, containerRef, slideInId);

        const slideInInstance: SlideInInstance<D, R> = {
          slideInId,
          component,
          containerRef,
          cdkOverlayRef,
          close$,
          wide: Boolean(options.wide),
          needConfirmation: undefined,
          data: options.data,
          slideInRef: undefined,
        };

        this.handleOverlayEvents(cdkOverlayRef, slideInInstance);
        this.createContentPortal(slideInInstance);
        this.updateSlideInInstances(slideInInstance);

        return close$;
      }),
      share(),
    );

    open$.pipe(untilDestroyed(this)).subscribe();

    return open$.pipe(take(1));
  }

  private swap<D, R>(component: ComponentInSlideIn<D, R>, options: { wide?: boolean }): void {
    const prevInstance = this.slideInInstances().at(-1);
    if (!prevInstance) return;

    prevInstance.component = component;
    prevInstance.wide = Boolean(options?.wide);
    prevInstance.containerRef.instance.slideOut().pipe(
      delay(0),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.createContentPortal(prevInstance);
        this.updateSlideInInstances(prevInstance);
        prevInstance.containerRef.instance.slideIn();
      },
    });
  }

  private animateOutTopComponent(): Observable<void> {
    const topComponent = this.slideInInstances().at(-1);
    if (!topComponent) {
      return of(undefined);
    }
    return topComponent.containerRef.instance.slideOut();
  }

  private animateInTopComponent(): Observable<void> {
    const topComponent = this.slideInInstances().at(-1);
    if (!topComponent) {
      return of(undefined);
    }
    return topComponent.containerRef.instance.slideIn();
  }

  private handleOverlayEvents<D, R>(overlay: OverlayRef, instance: SlideInInstance<D, R>): void {
    overlay.backdropClick().pipe(untilDestroyed(this)).subscribe(() => {
      instance.slideInRef.close({ response: false as R, error: undefined });
    });
  }

  private updateSlideInInstances<D, R>(slideInInstance: SlideInInstance<D, R>): void {
    const isInstanceExists = this.slideInInstances().some(
      (instance) => instance.slideInId === slideInInstance.slideInId,
    );
    let updatedInstances: SlideInInstance<unknown, unknown>[];
    if (isInstanceExists) {
      updatedInstances = this.slideInInstances().map(
        (instance) => ({
          ...instance,
          slideInRef: instance.slideInId === slideInInstance.slideInId
            ? instance.slideInRef
            : slideInInstance.slideInRef,
        }),
      );
    } else {
      updatedInstances = [...this.slideInInstances(), slideInInstance];
    }
    this.slideInInstances.set(updatedInstances);
  }

  private createContentPortal<D, R>(slideInInstance: SlideInInstance<D, R>): void {
    slideInInstance.slideInRef = this.createSlideInRef(slideInInstance);

    const injector = this.createInjector(slideInInstance.slideInRef);
    slideInInstance.containerRef.instance.detachPortal();
    slideInInstance.containerRef.instance.makeWide(slideInInstance.wide);
    slideInInstance.containerRef.instance.attachPortal(
      new ComponentPortal(slideInInstance.component, null, injector),
    );
  }

  private getCloseSubject<R>(
    cdkOverlayRef: OverlayRef,
    containerRef: ComponentRef<SlideInContainerComponent>,
    slideInId: string,
  ): Subject<R | undefined> {
    const close$ = new Subject<R | undefined>();
    close$.pipe(
      switchMap(() => containerRef.instance.slideOut()),
      tap(() => {
        cdkOverlayRef.dispose();
        this.slideInInstances.set(
          this.slideInInstances().filter((slideInItem) => slideInItem.slideInId !== slideInId),
        );
      }),
      switchMap(() => this.animateInTopComponent()),
      untilDestroyed(this),
    ).subscribe();
    return close$;
  }

  private getOverlayConfig(): OverlayConfig {
    let rightPosition = '0';

    if (environment.debugPanel?.enabled) {
      const isDebugPanelOpen = this.store$.selectSignal(selectIsPanelOpen)();

      if (isDebugPanelOpen) {
        // Get the actual debug panel width from CSS variable
        const debugPanelWidth = getComputedStyle(document.documentElement)
          .getPropertyValue('--debug-panel-width') || '550px';
        rightPosition = debugPanelWidth;
      }
    }

    return new OverlayConfig({
      hasBackdrop: true,
      backdropClass: !this.slideInInstances().length ? 'custom-slide-in-backdrop' : 'custom-slide-in-nobackdrop',
      positionStrategy: this.cdkOverlay.position().global().top('48px').right(rightPosition),
      height: 'calc(100% - 48px)',
      panelClass: 'slide-in-panel',
    });
  }

  private createInjector<D, R>(ref: SlideInRef<D, R>): Injector {
    return Injector.create({
      providers: [
        { provide: SlideInRef<D, R>, useValue: ref },
      ],
      parent: this.injector,
    });
  }

  private createSlideInRef<D, R>(slideInInstance: SlideInInstance<D, R>): SlideInRef<D, R> {
    return {
      close: (response: SlideInResponse<R>): void => {
        (!response?.response ? this.canCloseSlideIn(slideInInstance.needConfirmation) : of(true)).pipe(
          filter(Boolean),
          untilDestroyed(this),
        ).subscribe({
          next: () => {
            slideInInstance.close$.next(response);
            slideInInstance.close$.complete();
          },
        });
      },
      swap: (component: ComponentInSlideIn<D, R>, options?: { wide?: boolean }): void => {
        this.canCloseSlideIn(slideInInstance.needConfirmation).pipe(
          filter(Boolean),
          untilDestroyed(this),
        ).subscribe({
          next: () => {
            this.swap(
              component,
              options,
            );
          },
        });
      },
      getData: (): D | undefined => {
        return cloneDeep(slideInInstance.data);
      },
      requireConfirmationWhen: (needConfirmation: () => Observable<boolean>): void => {
        slideInInstance.needConfirmation = needConfirmation;
      },
    } as SlideInRef<D, R>;
  }

  private canCloseSlideIn(needConfirmation: () => Observable<boolean>): Observable<boolean> {
    if (!needConfirmation) {
      return of(true);
    }

    return needConfirmation().pipe(
      switchMap((shouldConfirm) => (shouldConfirm ? this.unsavedChangesService.showConfirmDialog() : of(true))),
    );
  }
}
