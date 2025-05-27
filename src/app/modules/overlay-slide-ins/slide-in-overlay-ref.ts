import { OverlayRef } from '@angular/cdk/overlay';
import { ComponentRef } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { OverlayContainerComponent } from 'app/modules/overlay-slide-ins/components/overlay-container/overlay-container.component';

export class SlideInOverlayRef<T = unknown> {
  afterClosed$: Observable<T | undefined>;

  constructor(
    public overlayRef: OverlayRef,
    public containerRef: ComponentRef<OverlayContainerComponent>,
    private close$: Subject<T | undefined>,
  ) {
    this.afterClosed$ = this.close$.asObservable();
  }

  close(result?: T): void {
    this.containerRef.instance.startCloseAnimation().then(() => {
      this.overlayRef.dispose();
      this.close$.next(result);
      this.close$.complete();
    });
  }
}
