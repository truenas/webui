import { OverlayRef } from '@angular/cdk/overlay';
import { ComponentRef } from '@angular/core';
import { Subject } from 'rxjs';
import { OverlayContainerComponent } from 'app/modules/overlay-slide-ins/components/overlay-container/overlay-container.component';

export class SlideInOverlayRef<T = unknown> {
  private afterClosedSubject = new Subject<T | undefined>();
  afterClosed$ = this.afterClosedSubject.asObservable();

  constructor(private overlayRef: OverlayRef, private containerRef: ComponentRef<OverlayContainerComponent>) {}

  close(result?: T): void {
    this.containerRef.instance.startCloseAnimation().then(() => {
      this.overlayRef.dispose();
      this.afterClosedSubject.next(result);
      this.afterClosedSubject.complete();
    });
  }
}
