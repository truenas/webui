import { Injectable } from '@angular/core';
import { UUID } from 'angular2-uuid';
import { MonoTypeOperatorFunction, Observable, of, share, Subject, Subscriber, switchMap, takeUntil, throwError } from 'rxjs';
import { IncomingApiMessageType, OutgoingApiMessageType } from 'app/enums/api-message-type.enum';
import { ApiEventMethod, ApiEventTyped, ResultMessage } from 'app/interfaces/api-message.interface';
import { WebSocketHandlerService } from 'app/services/websocket/websocket-handler.service';

@Injectable({
  providedIn: 'root',
})
export class ApiEventService {
  private readonly eventSubscribers = new Map<ApiEventMethod, Observable<ApiEventTyped>>();
  readonly clearSubscriptions$ = new Subject<void>();

  constructor(
    private wsHandler: WebSocketHandlerService,
  ) {
    this.wsHandler.isConnected$?.subscribe((isConnected) => {
      if (!isConnected) {
        this.endAllEvents();
      }
    });
  }

  private getEventSubscriber<K extends ApiEventMethod, R extends ApiEventTyped<K>>(name: K): Observable<R> {
    const id = UUID.UUID();
    return this.wsHandler.wsConnection.event(
      () => ({ id, name, msg: OutgoingApiMessageType.Sub }),
      () => ({ id, msg: OutgoingApiMessageType.UnSub }),
      (message: R) => (message.collection === name && message.msg !== IncomingApiMessageType.NoSub),
    );
  }

  endAllEvents(): void {
    this.clearSubscriptions$.next();
    this.eventSubscribers.clear();
  }

  getEndEventsPipe<T>(): MonoTypeOperatorFunction<T> {
    return takeUntil(this.clearSubscriptions$);
  }

  subscribe<K extends ApiEventMethod = ApiEventMethod>(method: K | `${K}:${string}`): Observable<ApiEventTyped<K>> {
    if (this.eventSubscribers.has(method as K)) {
      return this.eventSubscribers.get(method as K);
    }
    const observable$ = new Observable((trigger: Subscriber<ApiEventTyped<K>>) => {
      const subscription = this.getEventSubscriber<K, ApiEventTyped<K>>(method as K).subscribe(trigger);
      return () => {
        subscription.unsubscribe();
        this.eventSubscribers.delete(method as K);
      };
    }).pipe(
      switchMap((apiEvent) => {
        const erroredEvent = apiEvent as unknown as ResultMessage;
        if (erroredEvent?.error) {
          console.error('Error: ', erroredEvent.error);
          return throwError(() => erroredEvent.error);
        }
        return of(apiEvent);
      }),
      share(),
      takeUntil(this.clearSubscriptions$),
    );

    this.eventSubscribers.set(method as K, observable$);
    return observable$;
  }
}
