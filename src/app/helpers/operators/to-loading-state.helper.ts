import { of, OperatorFunction, pipe } from 'rxjs';
import {
  catchError, map, startWith,
} from 'rxjs/operators';
import { WebSocketError } from 'app/interfaces/websocket-error.interface';

export interface LoadingState<T> {
  isLoading: boolean;
  value?: T;
  error?: WebSocketError | Error;
}

/**
 * Usage:
 * myData$ = this.ws.call('my.method').pipe(toLoadingState());
 *
 * <ng-container *ngIf="myData$ | async as data">
 *   <my-loading-spinner *ngIf="data.isLoading"></my-loading-spinner>
 *   <my-error-component *ngIf="data.error" [error]="data.error"></my-error-component>
 *   <my-data-component *ngIf="data.value" [data]="data.value"></my-data-component>
 * </ng-container>
 *
 * If you need to use your observable in multiple places, don't forget to use shareReplay.
 */
export function toLoadingState<T>(): OperatorFunction<T, LoadingState<T>> {
  return pipe(
    map((value) => ({ isLoading: false, value })),
    catchError((error: WebSocketError | Error) => of({ isLoading: false, error })),
    startWith({ isLoading: true }),
  );
}
