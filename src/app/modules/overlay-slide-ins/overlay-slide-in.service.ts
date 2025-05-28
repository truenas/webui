import {
  Overlay,
  OverlayConfig,
} from '@angular/cdk/overlay';
import {
  ComponentPortal,
} from '@angular/cdk/portal';
import {
  computed,
  Injectable,
  Injector,
  signal,
  Type,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { UUID } from 'angular2-uuid';
import { Subject } from 'rxjs';
import { OverlayContainerComponent } from 'app/modules/overlay-slide-ins/components/overlay-container/overlay-container.component';
import { SlideInOverlayRef } from 'app/modules/overlay-slide-ins/slide-in-overlay-ref';
import { SLIDE_IN_DATA } from 'app/modules/overlay-slide-ins/slide-in.tokens';

interface OverlayInstance<T> {
  overlayId: string;
  slideInRef: SlideInOverlayRef;
  component: Type<T>;
  config: { data?: unknown; wide?: boolean };
  close$: Subject<T | undefined>;
}

@UntilDestroy()
@Injectable({ providedIn: 'root' })
export class OverlaySlideInService {
  private overlays = signal<OverlayInstance<unknown>[]>([]);
  openOverlays = computed(() => this.overlays()?.length);

  constructor(
    private overlay: Overlay,
    private injector: Injector,
  ) {}

  open<C, T = unknown>(
    component: Type<C>,
    config: { data?: unknown; wide?: boolean } = {},
    id?: string,
  ): SlideInOverlayRef<T> {
    const overlayId = id || (UUID.UUID());

    const overlayRef = this.overlay.create(this.getOverlayConfig());
    const containerPortal = new ComponentPortal(OverlayContainerComponent);
    const containerRef = overlayRef.attach(containerPortal);

    const panelElement = overlayRef.overlayElement;
    panelElement.classList.remove('wide', 'normal');
    panelElement.classList.add(config.wide ? 'wide' : 'normal');

    const previousOverlay = this.overlays().find(
      (overlayItem) => overlayItem.overlayId === overlayId,
    );
    let close$ = previousOverlay?.close$ as Subject<T | undefined>;
    if (!close$) {
      close$ = new Subject<T | undefined>();
    }
    const slideInRef = new SlideInOverlayRef<T>(overlayRef, containerRef, close$);

    const injector = this.createInjector(config.data, slideInRef);
    const contentPortal = new ComponentPortal(component, null, injector);
    containerRef.instance.portalOutlet.attach(contentPortal);

    this.overlays.set([
      ...this.overlays(),
      {
        overlayId, slideInRef, component, config, close$,
      },
    ]);

    overlayRef.backdropClick().pipe(untilDestroyed(this)).subscribe(() => {
      slideInRef.close();
    });

    overlayRef.detachments().pipe(untilDestroyed(this)).subscribe(() => {
      this.overlays.set(this.overlays().filter((overlayItem) => overlayItem.overlayId !== overlayId));
    });

    return slideInRef;
  }

  swap<T>(component: Type<T>, config: { data?: unknown; wide?: boolean } = {}): void {
    const lastOverlay = this.overlays()[this.overlays().length - 1];
    if (!lastOverlay) return;

    const { slideInRef: slideInRefPrev } = lastOverlay;

    const slideInRef = new SlideInOverlayRef<T>(
      slideInRefPrev.overlayRef,
      slideInRefPrev.containerRef,
      lastOverlay.close$ as Subject<T | undefined>,
    );
    const injector = this.createInjector(config.data, slideInRef);
    const contentPortal = new ComponentPortal(component, null, injector);

    slideInRefPrev.containerRef.instance.startCloseAnimation().then(() => {
      slideInRefPrev.containerRef.instance.portalOutlet.detach();
      slideInRefPrev.containerRef.instance.resetAnimation();
      const panelElement = slideInRefPrev.overlayRef.overlayElement;
      panelElement.classList.remove('wide', 'normal');
      panelElement.classList.add(config.wide ? 'wide' : 'normal');
      slideInRefPrev.containerRef.instance.portalOutlet.attach(contentPortal);
    });
  }

  private getOverlayConfig(): OverlayConfig {
    return new OverlayConfig({
      hasBackdrop: true,
      backdropClass: !this.overlays().length ? 'custom-overlay-backdrop' : 'custom-overlay-nobackdrop',
      positionStrategy: this.overlay.position().global().top('48px').right('0'),
      height: 'calc(100% - 48px)',
      panelClass: 'overlay-slide-in-panel',
    });
  }

  private createInjector(data: unknown, ref: SlideInOverlayRef): Injector {
    return Injector.create({
      providers: [
        { provide: SlideInOverlayRef, useValue: ref },
        { provide: SLIDE_IN_DATA, useValue: data },
      ],
      parent: this.injector,
    });
  }
}
