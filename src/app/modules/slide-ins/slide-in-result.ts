import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  filter, map, NEVER, Observable, of, shareReplay, Subscription,
} from 'rxjs';
import { SlideInResponse } from 'app/modules/slide-ins/slide-in.interface';

/**
 * Non-nullable variant of T.
 * Used to narrow the response type after filtering out null/undefined cancellations.
 */
type NonNullish<T> = Exclude<T, null | undefined>;

/**
 * Extends Observable<SlideInResponse<R>> with convenience methods
 * for common slide-in patterns.
 *
 * Since it extends Observable, existing .pipe() and .subscribe() callers
 * continue to work unchanged, while new callers can use .onSuccess().
 *
 * Internally the source is replayed (shareReplay(1)) so that subscribing
 * via both the Observable interface and the convenience methods does not
 * cause duplicate side-effects on the upstream.
 */
export class SlideInResult<R> extends Observable<SlideInResponse<R>> {
  private shared$: Observable<SlideInResponse<R>>;

  constructor(source$: Observable<SlideInResponse<R>>) {
    // refCount: false so late subscribers (e.g. onCancel after onSuccess) still
    // receive the replayed value even if earlier subscribers have already unsubscribed.
    // Safe because the source completes after a single emission.
    const shared$ = source$.pipe(shareReplay({ bufferSize: 1, refCount: false }));
    super((subscriber) => shared$.subscribe(subscriber));
    this.shared$ = shared$;
  }

  /**
   * Creates a SlideInResult that never emits and never completes.
   * Useful in tests where the slide-in result is irrelevant:
   *   mockProvider(SlideIn, { open: jest.fn(() => SlideInResult.empty()) })
   *
   * Note: since this never emits or completes, .onSuccess / .onCancel / .onClose
   * callbacks will NOT fire. Use .cancel() or .success() if you need them to.
   */
  static empty<T = unknown>(): SlideInResult<T> {
    return new SlideInResult<T>(NEVER);
  }

  /**
   * Creates a SlideInResult that emits a cancel (undefined response). Useful in tests:
   *   mockProvider(SlideIn, { open: jest.fn(() => SlideInResult.cancel()) })
   */
  static cancel<T = unknown>(): SlideInResult<T> {
    return new SlideInResult<T>(of({ response: undefined }));
  }

  /**
   * Creates a SlideInResult that emits a single successful response. Useful in tests:
   *   mockProvider(SlideIn, { open: jest.fn(() => SlideInResult.success(true)) })
   */
  static success<T>(value: T): SlideInResult<T> {
    return new SlideInResult<T>(of({ response: value }));
  }

  /**
   * Observable that emits only the unwrapped response value
   * when the slide-in was closed successfully (non-null response).
   * Useful in switchMap chains where .onSuccess() cannot be used.
   *
   * Unlike .onSuccess(), this does NOT auto-unsubscribe — callers must
   * add their own takeUntilDestroyed() or other teardown.
   */
  get success$(): Observable<NonNullish<R>> {
    return this.shared$.pipe(
      filter((result): result is SlideInResponse<R> & { response: NonNullish<R> } => result.response != null),
      map((result) => result.response),
    );
  }

  /**
   * Subscribes to successful slide-in closes and invokes the callback.
   * Automatically unsubscribes when the caller's DestroyRef is destroyed.
   *
   * Replaces the common pattern:
   *   .pipe(filter(r => r.response != null), takeUntilDestroyed(destroyRef)).subscribe(...)
   *
   * Note: uses nullish check (!=), so falsy values like false, 0, '' are treated as success.
   */
  onSuccess(destroyRef: DestroyRef, callback: (response: NonNullish<R>) => void): Subscription {
    return this.success$.pipe(
      takeUntilDestroyed(destroyRef),
    ).subscribe((response) => callback(response));
  }

  /**
   * Subscribes to slide-in closes where the user cancelled (null/undefined response)
   * and invokes the callback. Automatically unsubscribes when destroyed.
   */
  onCancel(destroyRef: DestroyRef, callback: () => void): Subscription {
    return this.shared$.pipe(
      filter((result) => result.response == null),
      takeUntilDestroyed(destroyRef),
    ).subscribe(() => callback());
  }

  /**
   * Subscribes to any slide-in close (success or cancel) and invokes the callback.
   * Automatically unsubscribes when the caller's DestroyRef is destroyed.
   */
  onClose(destroyRef: DestroyRef, callback: () => void): Subscription {
    return this.shared$.pipe(
      takeUntilDestroyed(destroyRef),
    ).subscribe(() => callback());
  }
}
