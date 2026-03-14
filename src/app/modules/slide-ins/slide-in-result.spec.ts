import { DestroyRef } from '@angular/core';
import { of, Subject, Subscription } from 'rxjs';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { SlideInResponse } from 'app/modules/slide-ins/slide-in.interface';

function mockDestroyRef(): DestroyRef {
  const callbacks: (() => void)[] = [];
  return {
    onDestroy: (cb: () => void) => callbacks.push(cb),
    destroy: () => callbacks.forEach((cb) => cb()),
  } as unknown as DestroyRef & { destroy: () => void };
}

describe('SlideInResult', () => {
  describe('empty()', () => {
    it('creates a result that never emits and never completes', () => {
      const result$ = SlideInResult.empty();
      const emitted: unknown[] = [];
      let completed = false;

      result$.subscribe({
        next: (val) => emitted.push(val),
        complete: () => { completed = true; },
      });

      expect(emitted).toEqual([]);
      expect(completed).toBe(false);
    });
  });

  describe('cancel()', () => {
    it('creates a result that emits a cancel response', () => {
      const result$ = SlideInResult.cancel();
      const emitted: SlideInResponse[] = [];

      result$.subscribe((val) => emitted.push(val));

      expect(emitted).toEqual([{ response: undefined }]);
    });
  });

  describe('success()', () => {
    it('creates a result that emits a single successful response', () => {
      const result$ = SlideInResult.success('created');
      const emitted: SlideInResponse<string>[] = [];

      result$.subscribe((val) => emitted.push(val));

      expect(emitted).toEqual([{ response: 'created' }]);
    });
  });

  describe('as Observable', () => {
    it('emits the original SlideInResponse via subscribe()', () => {
      const response: SlideInResponse<string> = { response: 'created' };
      const result$ = new SlideInResult(of(response));
      const emitted: SlideInResponse<string>[] = [];

      result$.subscribe((val) => emitted.push(val));

      expect(emitted).toEqual([{ response: 'created' }]);
    });

    it('works with .pipe()', () => {
      const response: SlideInResponse<number> = { response: 42 };
      const result$ = new SlideInResult(of(response));
      const emitted: number[] = [];

      result$.pipe().subscribe((val) => emitted.push(val.response));

      expect(emitted).toEqual([42]);
    });
  });

  describe('success$', () => {
    it('emits the unwrapped value for non-null responses', () => {
      const result$ = new SlideInResult(of({ response: 'data' } as SlideInResponse<string>));
      const emitted: string[] = [];

      result$.success$.subscribe((val) => emitted.push(val));

      expect(emitted).toEqual(['data']);
    });

    it('emits for false response', () => {
      const result$ = new SlideInResult(of({ response: false } as SlideInResponse<boolean>));
      const emitted: unknown[] = [];

      result$.success$.subscribe((val) => emitted.push(val));

      expect(emitted).toEqual([false]);
    });

    it('emits for 0 response', () => {
      const result$ = new SlideInResult(of({ response: 0 } as SlideInResponse<number>));
      const emitted: unknown[] = [];

      result$.success$.subscribe((val) => emitted.push(val));

      expect(emitted).toEqual([0]);
    });

    it('emits for empty string response', () => {
      const result$ = new SlideInResult(of({ response: '' } as SlideInResponse<string>));
      const emitted: unknown[] = [];

      result$.success$.subscribe((val) => emitted.push(val));

      expect(emitted).toEqual(['']);
    });

    it('emits for null response (null is not a cancellation)', () => {
      const result$ = new SlideInResult(of({ response: null } as SlideInResponse<string | null>));
      const emitted: unknown[] = [];

      result$.success$.subscribe((val) => emitted.push(val));

      expect(emitted).toEqual([null]);
    });

    it('does not emit for undefined response (cancellation)', () => {
      const result$ = new SlideInResult(of({ response: undefined } as SlideInResponse<string | undefined>));
      const emitted: unknown[] = [];

      result$.success$.subscribe((val) => emitted.push(val));

      expect(emitted).toEqual([]);
    });
  });

  describe('onSuccess', () => {
    it('returns a Subscription', () => {
      const result$ = new SlideInResult(of({ response: 'saved' } as SlideInResponse<string>));

      const subscription = result$.onSuccess(mockDestroyRef(), jest.fn());

      expect(subscription).toBeInstanceOf(Subscription);
    });

    it('calls callback with unwrapped value on non-null response', () => {
      const result$ = new SlideInResult(of({ response: 'saved' } as SlideInResponse<string>));
      const callback = jest.fn();

      result$.onSuccess(mockDestroyRef(), callback);

      expect(callback).toHaveBeenCalledWith('saved');
    });

    it('does not call callback on undefined response (cancellation)', () => {
      const result$ = new SlideInResult(of({ response: undefined } as SlideInResponse<string>));
      const callback = jest.fn();

      result$.onSuccess(mockDestroyRef(), callback);

      expect(callback).not.toHaveBeenCalled();
    });

    it('unsubscribes when DestroyRef is destroyed', () => {
      const source$ = new Subject<SlideInResponse<string>>();
      const result$ = new SlideInResult(source$);
      const destroyRef = mockDestroyRef();
      const callback = jest.fn();

      result$.onSuccess(destroyRef, callback);

      source$.next({ response: 'first' });
      expect(callback).toHaveBeenCalledTimes(1);

      (destroyRef as DestroyRef & { destroy: () => void }).destroy();

      source$.next({ response: 'second' });
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('onCancel', () => {
    it('calls callback when response is undefined', () => {
      const result$ = new SlideInResult(of({ response: undefined } as SlideInResponse<string>));
      const callback = jest.fn();

      result$.onCancel(mockDestroyRef(), callback);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('does not call callback when response is defined', () => {
      const result$ = new SlideInResult(of({ response: 'data' } as SlideInResponse<string>));
      const callback = jest.fn();

      result$.onCancel(mockDestroyRef(), callback);

      expect(callback).not.toHaveBeenCalled();
    });

    it('does not call callback when response is null (null is not a cancellation)', () => {
      const result$ = new SlideInResult(of({ response: null } as SlideInResponse<string | null>));
      const callback = jest.fn();

      result$.onCancel(mockDestroyRef(), callback);

      expect(callback).not.toHaveBeenCalled();
    });

    it('unsubscribes when DestroyRef is destroyed', () => {
      const source$ = new Subject<SlideInResponse<string>>();
      const result$ = new SlideInResult(source$);
      const destroyRef = mockDestroyRef();
      const callback = jest.fn();

      result$.onCancel(destroyRef, callback);

      source$.next({ response: undefined });
      expect(callback).toHaveBeenCalledTimes(1);

      (destroyRef as DestroyRef & { destroy: () => void }).destroy();

      source$.next({ response: undefined });
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('concurrent onSuccess and onCancel on the same result', () => {
    it('calls only onSuccess when response is non-null', () => {
      const result$ = SlideInResult.success('saved');
      const successCb = jest.fn();
      const cancelCb = jest.fn();
      const destroyRef = mockDestroyRef();

      result$.onSuccess(destroyRef, successCb);
      result$.onCancel(destroyRef, cancelCb);

      expect(successCb).toHaveBeenCalledWith('saved');
      expect(cancelCb).not.toHaveBeenCalled();
    });

    it('calls only onCancel when response is undefined', () => {
      const result$ = SlideInResult.cancel();
      const successCb = jest.fn();
      const cancelCb = jest.fn();
      const destroyRef = mockDestroyRef();

      result$.onSuccess(destroyRef, successCb);
      result$.onCancel(destroyRef, cancelCb);

      expect(successCb).not.toHaveBeenCalled();
      expect(cancelCb).toHaveBeenCalledTimes(1);
    });

    it('works when onCancel subscribes after onSuccess unsubscribes (synchronous source)', () => {
      const result$ = SlideInResult.cancel();
      const destroyRef1 = mockDestroyRef();
      const destroyRef2 = mockDestroyRef();

      const successCb = jest.fn();
      result$.onSuccess(destroyRef1, successCb);
      (destroyRef1 as DestroyRef & { destroy: () => void }).destroy();

      const cancelCb = jest.fn();
      result$.onCancel(destroyRef2, cancelCb);

      expect(cancelCb).toHaveBeenCalledTimes(1);
    });
  });

  describe('onClose', () => {
    it('calls callback on successful close', () => {
      const result$ = new SlideInResult(of({ response: 'data' } as SlideInResponse<string>));
      const callback = jest.fn();

      result$.onClose(mockDestroyRef(), callback);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('calls callback on cancel close', () => {
      const result$ = new SlideInResult(of({ response: undefined } as SlideInResponse<string>));
      const callback = jest.fn();

      result$.onClose(mockDestroyRef(), callback);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('unsubscribes when DestroyRef is destroyed', () => {
      const source$ = new Subject<SlideInResponse<string>>();
      const result$ = new SlideInResult(source$);
      const destroyRef = mockDestroyRef();
      const callback = jest.fn();

      result$.onClose(destroyRef, callback);

      source$.next({ response: 'first' });
      expect(callback).toHaveBeenCalledTimes(1);

      (destroyRef as DestroyRef & { destroy: () => void }).destroy();

      source$.next({ response: 'second' });
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });
});
