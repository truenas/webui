import { DestroyRef } from '@angular/core';
import { of, Subject } from 'rxjs';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { SlideInResponse } from 'app/modules/slide-ins/slide-in.interface';

function mockDestroyRef(): DestroyRef {
  const callbacks: (() => void)[] = [];
  return {
    onDestroy: (cb: () => void) => callbacks.push(cb),
    destroy: () => callbacks.forEach((cb) => cb()),
  } as DestroyRef & { destroy: () => void };
}

describe('SlideInResult', () => {
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
    it('emits the unwrapped value for truthy responses', () => {
      const result$ = new SlideInResult(of({ response: 'data' } as SlideInResponse<string>));
      const emitted: string[] = [];

      result$.success$.subscribe((val) => emitted.push(val));

      expect(emitted).toEqual(['data']);
    });

    it('does not emit for null response', () => {
      const result$ = new SlideInResult(of({ response: null } as SlideInResponse<string | null>));
      const emitted: unknown[] = [];

      result$.success$.subscribe((val) => emitted.push(val));

      expect(emitted).toEqual([]);
    });

    it('does not emit for undefined response', () => {
      const result$ = new SlideInResult(of({ response: undefined } as SlideInResponse<string | undefined>));
      const emitted: unknown[] = [];

      result$.success$.subscribe((val) => emitted.push(val));

      expect(emitted).toEqual([]);
    });

    it('does not emit for false response', () => {
      const result$ = new SlideInResult(of({ response: false } as SlideInResponse<boolean>));
      const emitted: unknown[] = [];

      result$.success$.subscribe((val) => emitted.push(val));

      expect(emitted).toEqual([]);
    });
  });

  describe('onSuccess', () => {
    it('calls callback with unwrapped value on truthy response', () => {
      const result$ = new SlideInResult(of({ response: 'saved' } as SlideInResponse<string>));
      const callback = jest.fn();

      result$.onSuccess(callback, mockDestroyRef());

      expect(callback).toHaveBeenCalledWith('saved');
    });

    it('does not call callback on falsy response', () => {
      const result$ = new SlideInResult(of({ response: null } as SlideInResponse<string | null>));
      const callback = jest.fn();

      result$.onSuccess(callback, mockDestroyRef());

      expect(callback).not.toHaveBeenCalled();
    });

    it('unsubscribes when DestroyRef is destroyed', () => {
      const source$ = new Subject<SlideInResponse<string>>();
      const result$ = new SlideInResult(source$);
      const destroyRef = mockDestroyRef();
      const callback = jest.fn();

      result$.onSuccess(callback, destroyRef);

      source$.next({ response: 'first' });
      expect(callback).toHaveBeenCalledTimes(1);

      (destroyRef as DestroyRef & { destroy: () => void }).destroy();

      source$.next({ response: 'second' });
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('onCancel', () => {
    it('calls callback when response is falsy', () => {
      const result$ = new SlideInResult(of({ response: null } as SlideInResponse<string | null>));
      const callback = jest.fn();

      result$.onCancel(callback, mockDestroyRef());

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('does not call callback when response is truthy', () => {
      const result$ = new SlideInResult(of({ response: 'data' } as SlideInResponse<string>));
      const callback = jest.fn();

      result$.onCancel(callback, mockDestroyRef());

      expect(callback).not.toHaveBeenCalled();
    });

    it('unsubscribes when DestroyRef is destroyed', () => {
      const source$ = new Subject<SlideInResponse<string | null>>();
      const result$ = new SlideInResult(source$);
      const destroyRef = mockDestroyRef();
      const callback = jest.fn();

      result$.onCancel(callback, destroyRef);

      source$.next({ response: null });
      expect(callback).toHaveBeenCalledTimes(1);

      (destroyRef as DestroyRef & { destroy: () => void }).destroy();

      source$.next({ response: null });
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });
});
