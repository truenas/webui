import { OverlayRef } from '@angular/cdk/overlay';
import { ComponentRef, Type } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { SlideInContainerComponent } from 'app/modules/slide-ins/components/slide-in-container/slide-in-container.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';

export interface SlideInInstance<D, R> {
  slideInId: string;
  slideInRef: SlideInRef<D, R>;
  component: ComponentInSlideIn<D, R>;
  containerRef: ComponentRef<SlideInContainerComponent>;
  cdkOverlayRef: OverlayRef;
  close$: Subject<SlideInResponse<R>>;
  data: D;
  wide: boolean;
  needConfirmation: () => Observable<boolean>;
}

export type ComponentInSlideIn<D, R> = Type<{
  slideInRef: SlideInRef<D, R>;
}>;

export interface SlideInResponse<T = unknown> {
  response: T;
  error: unknown;
}
