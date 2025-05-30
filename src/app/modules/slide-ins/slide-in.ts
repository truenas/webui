import {
  Overlay,
  OverlayConfig,
  OverlayRef,
} from '@angular/cdk/overlay';
import {
  ComponentPortal,
  ComponentType,
} from '@angular/cdk/portal';
import {
  ComponentRef,
  computed,
  Injectable,
  Injector,
  signal,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { UUID } from 'angular2-uuid';
import { cloneDeep } from 'lodash-es';
import {
  filter, Observable, of, Subject, switchMap,
} from 'rxjs';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SlideInContainerComponent } from 'app/modules/slide-ins/components/slide-in-container/slide-in-container.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ComponentInSlideIn, SlideInInstance, SlideInResponse } from 'app/modules/slide-ins/slide-in.interface';

@UntilDestroy()
// eslint-disable-next-line angular-file-naming/service-filename-suffix
@Injectable({ providedIn: 'root' })
export class SlideIn {
  private slideInInstances = signal<SlideInInstance<unknown, unknown>[]>([]);
  readonly openSlideIns = computed(() => this.slideInInstances()?.length);

  constructor(
    private cdkOverlay: Overlay,
    private injector: Injector,
    private dialogService: DialogService,
    private translate: TranslateService,
  ) {}

  closeAll(): void {
    for (const slideInInstance of this.slideInInstances()) {
      slideInInstance.slideInRef.close(undefined);
    }
  }

  open<D, R>(
    component: ComponentInSlideIn<D, R>,
    options: { data?: D; wide?: boolean } = {},
  ): Observable<SlideInResponse<R>> {
    const slideInId = UUID.UUID();

    const cdkOverlayRef = this.cdkOverlay.create(this.getOverlayConfig());
    const containerPortal = new ComponentPortal(SlideInContainerComponent);
    const containerRef = cdkOverlayRef.attach(containerPortal);

    this.addCssClassForWidth(cdkOverlayRef.overlayElement, options.wide);

    const close$ = this.getCloseSubject<SlideInResponse<R>>(cdkOverlayRef, containerRef);
    const slideInInstance = {
      slideInId,
      component,
      containerRef,
      cdkOverlayRef,
      close$,
      needConfirmation: undefined,
      data: options.data,
      slideInRef: undefined,
    } as SlideInInstance<D, R>;

    const slideInRef = this.createSlideInRef(slideInInstance);

    this.slideInInstances.set([
      ...this.slideInInstances(),
      {
        ...slideInInstance,
        slideInRef,
      },
    ]);

    const injector = this.createInjector(slideInRef);
    const contentPortal = new ComponentPortal(component as unknown as ComponentType<unknown>, null, injector);
    containerRef.instance.portalOutlet.attach(contentPortal);

    cdkOverlayRef.backdropClick().pipe(untilDestroyed(this)).subscribe(() => {
      slideInRef.close(undefined);
    });

    cdkOverlayRef.detachments().pipe(untilDestroyed(this)).subscribe(() => {
      this.slideInInstances.set(this.slideInInstances().filter((slideInItem) => slideInItem.slideInId !== slideInId));
    });

    return close$;
  }

  swap<D, R>(component: ComponentInSlideIn<D, R>, config: { data?: D; wide?: boolean } = {}): void {
    const lastSlideIn = this.slideInInstances()[this.slideInInstances().length - 1];
    if (!lastSlideIn) return;

    const { cdkOverlayRef: prevOverlayRef, containerRef: prevContainerRef } = lastSlideIn;

    const slideInRef = this.createSlideInRef(lastSlideIn);
    const injector = this.createInjector(slideInRef);
    const contentPortal = new ComponentPortal(component as unknown as ComponentType<unknown>, null, injector);

    prevContainerRef.instance.startCloseAnimation().pipe(
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        prevContainerRef.instance.portalOutlet.detach();
        prevContainerRef.instance.resetAnimation();
        this.addCssClassForWidth(prevOverlayRef.overlayElement, config.wide);
        prevContainerRef.instance.portalOutlet.attach(contentPortal);
      },
    });
  }

  private getCloseSubject<R>(
    cdkOverlayRef: OverlayRef,
    containerRef: ComponentRef<SlideInContainerComponent>,
  ): Subject<R | undefined> {
    const close$ = new Subject<R | undefined>();
    close$.pipe(
      switchMap(() => containerRef.instance.startCloseAnimation()),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        cdkOverlayRef.dispose();
      },
    });
    return close$;
  }

  private addCssClassForWidth(panelElement: HTMLElement, wide: boolean): void {
    panelElement.classList.remove('wide', 'normal');
    panelElement.classList.add(wide ? 'wide' : 'normal');
  }

  private getOverlayConfig(): OverlayConfig {
    return new OverlayConfig({
      hasBackdrop: true,
      backdropClass: !this.slideInInstances().length ? 'custom-slide-in-backdrop' : 'custom-slide-in-nobackdrop',
      positionStrategy: this.cdkOverlay.position().global().top('48px').right('0'),
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

  private showConfirmDialog(): Observable<boolean> {
    return this.dialogService.confirm({
      title: this.translate.instant('Unsaved Changes'),
      message: this.translate.instant('You have unsaved changes. Are you sure you want to close?'),
      cancelText: this.translate.instant('No'),
      buttonText: this.translate.instant('Yes'),
      buttonColor: 'warn',
      hideCheckbox: true,
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
      swap: (component: ComponentInSlideIn<D, R>, options?: { wide?: boolean; data?: unknown }): void => {
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
      switchMap((shouldConfirm) => (shouldConfirm ? this.showConfirmDialog() : of(true))),
    );
  }
}
