import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, map, Observable } from 'rxjs';
import { SlideInResponse } from 'app/modules/slide-ins/slide-in.interface';

type Truthy<T> = Exclude<T, false | 0 | '' | null | undefined>;

/**
 * Extends Observable<SlideInResponse<R>> with convenience methods
 * for common slide-in patterns.
 *
 * Since it extends Observable, existing .pipe() and .subscribe() callers
 * continue to work unchanged, while new callers can use .onSuccess().
 */
export class SlideInResult<R> extends Observable<SlideInResponse<R>> {
  constructor(private source$: Observable<SlideInResponse<R>>) {
    super((subscriber) => source$.subscribe(subscriber));
  }

  /**
   * Observable that emits only the unwrapped response value
   * when the slide-in was closed successfully (truthy response).
   * Useful in switchMap chains.
   */
  readonly success$: Observable<Truthy<R>> = this.source$.pipe(
    filter((result): result is SlideInResponse<R> & { response: Truthy<R> } => !!result.response),
    map((result) => result.response),
  );

  /**
   * Subscribes to successful slide-in closes and invokes the callback.
   * Automatically unsubscribes when the caller's DestroyRef is destroyed.
   *
   * Replaces the common pattern:
   *   .pipe(filter(r => !!r.response), takeUntilDestroyed(destroyRef)).subscribe(...)
   */
  onSuccess(callback: (response: Truthy<R>) => void, destroyRef: DestroyRef): void {
    this.success$.pipe(
      takeUntilDestroyed(destroyRef),
    ).subscribe((response) => callback(response));
  }
}
