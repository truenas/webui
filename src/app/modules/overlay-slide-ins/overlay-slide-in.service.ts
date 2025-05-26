import {
  Overlay,
  OverlayRef,
  OverlayConfig,
} from '@angular/cdk/overlay';
import {
  ComponentPortal,
} from '@angular/cdk/portal';
import {
  ComponentRef,
  Injectable,
  Injector,
  Type,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { OverlayContainerComponent } from 'app/modules/overlay-slide-ins/components/overlay-container/overlay-container.component';
import { SlideInOverlayRef } from 'app/modules/overlay-slide-ins/slide-in-overlay-ref';
import { SLIDE_IN_DATA } from 'app/modules/overlay-slide-ins/slide-in.tokens';

interface OverlayInstance {
  overlayRef: OverlayRef;
  containerRef: ComponentRef<OverlayContainerComponent>;
}

@UntilDestroy()
@Injectable({ providedIn: 'root' })
export class OverlaySlideInService {
  private overlays: OverlayInstance[] = [];

  constructor(
    private overlay: Overlay,
    private injector: Injector,
  ) {}

  open<C, T = unknown>(component: Type<C>, config: { data?: unknown; wide?: boolean } = {}): SlideInOverlayRef<T> {
    const overlayRef = this.overlay.create(this.getOverlayConfig());
    const containerPortal = new ComponentPortal(OverlayContainerComponent);
    const containerRef = overlayRef.attach(containerPortal);

    const panelElement = overlayRef.overlayElement;
    panelElement.classList.remove('wide', 'normal');
    panelElement.classList.add(config.wide ? 'wide' : 'normal');
    const slideInRef = new SlideInOverlayRef<T>(overlayRef, containerRef);

    const injector = this.createInjector(config.data, slideInRef);
    const contentPortal = new ComponentPortal(component, null, injector);
    containerRef.instance.portalOutlet.attach(contentPortal);

    this.overlays.push({ overlayRef, containerRef });

    overlayRef.backdropClick().pipe(untilDestroyed(this)).subscribe(() => slideInRef.close());

    overlayRef.detachments().pipe(untilDestroyed(this)).subscribe(() => {
      this.overlays = this.overlays.filter((overlayItem) => overlayItem.overlayRef !== overlayRef);
    });

    return slideInRef;
  }

  swap<T>(component: Type<T>, config: { data?: unknown; wide?: boolean } = {}): void {
    const lastOverlay = this.overlays[this.overlays.length - 1];
    if (!lastOverlay) return;

    const { overlayRef, containerRef } = lastOverlay;

    const slideInRef = new SlideInOverlayRef<T>(overlayRef, containerRef);
    const injector = this.createInjector(config.data, slideInRef);
    const contentPortal = new ComponentPortal(component, null, injector);

    containerRef.instance.startCloseAnimation().then(() => {
      containerRef.instance.portalOutlet.detach();
      containerRef.instance.resetAnimation();
      const panelElement = lastOverlay.overlayRef.overlayElement;
      panelElement.classList.remove('wide', 'normal');
      panelElement.classList.add(config.wide ? 'wide' : 'normal');
      containerRef.instance.portalOutlet.attach(contentPortal);
    });
  }

  private getOverlayConfig(): OverlayConfig {
    return new OverlayConfig({
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-dark-backdrop',
      positionStrategy: this.overlay.position().global().top('0').right('0'),
      panelClass: 'overlay-slide-in-panel',
    });
  }

  private createInjector(data: unknown, ref: SlideInOverlayRef<unknown>): Injector {
    return Injector.create({
      providers: [
        { provide: SlideInOverlayRef, useValue: ref },
        { provide: SLIDE_IN_DATA, useValue: data },
      ],
      parent: this.injector,
    });
  }
}
