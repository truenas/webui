import { Observable } from 'rxjs';
import { webSocket as rxjsWebSocket, WebSocketSubject, WebSocketSubjectConfig } from 'rxjs/webSocket';

export class WebSocketConnection {
  private ws$: WebSocketSubject<unknown>;
  private wsAsObservable$: Observable<unknown>;
  get stream$(): Observable<unknown> {
    return this.wsAsObservable$;
  }

  get closed(): boolean {
    return this.ws$?.closed;
  }

  constructor(
    private webSocket: typeof rxjsWebSocket,
  ) { }

  connect(config: WebSocketSubjectConfig<unknown>): void {
    if (this.ws$) {
      this.ws$.complete();
    }

    performance.mark(`WS Init. URL: ${config.url}"`);
    this.ws$ = this.webSocket(config);

    this.wsAsObservable$ = this.ws$.asObservable();
  }

  send(payload: unknown): void {
    this.ws$.next(payload);
  }

  close(): void {
    this.ws$?.complete();
    this.ws$ = undefined;
  }

  event<R>(
    subMsg: () => unknown,
    unsubMsg: () => unknown,
    messageFilter: (value: unknown) => boolean,
  ): Observable<R> {
    return this.ws$.multiplex(
      subMsg,
      unsubMsg,
      messageFilter,
    ) as Observable<R>;
  }
}
