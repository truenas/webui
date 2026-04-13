import { OverlayRef } from '@angular/cdk/overlay';
import { ComponentRef, Type } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { SlideInContainerComponent } from 'app/modules/slide-ins/components/slide-in-container/slide-in-container.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';

export interface SlideInInstance<D, R> {
  slideInId: string;
  slideInRef: SlideInRef<D, R> | undefined;
  component: ComponentInSlideIn<D, R>;
  containerRef: ComponentRef<SlideInContainerComponent>;
  cdkOverlayRef: OverlayRef;
  close$: Subject<SlideInResponse<R>>;
  data: D | undefined;
  wide: boolean;
  needConfirmation: (() => Observable<boolean>) | undefined;
}

export type ComponentInSlideIn<D, R> = Type<{
  slideInRef: SlideInRef<D, R>;
}>;

/**
 * Response emitted when a slide-in closes.
 *
 * - `response` holds the value returned by the form on success.
 * - `undefined` signals that the user cancelled (closed without saving).
 *
 * {@link SlideInResult} convenience methods (onSuccess, onCancel, success$)
 * use a strict `=== undefined` check, so forms may safely return any value
 * (including `null`, `false`, `0`, `''`) as a legitimate success response.
 */
export interface SlideInResponse<T = unknown> {
  response: T | undefined;
}
