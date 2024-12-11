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

  connect(config: WebSocketSubjectConfig<unknown>): Observable<unknown> {
    if (this.ws$) {
      this.ws$.complete();
    }

    performance.mark(`WS Init. URL: ${config.url}"`);
    this.ws$ = this.webSocket(config);

    this.wsAsObservable$ = this.ws$.asObservable();
    return this.stream$;
  }

  send(payload: unknown): void {
    this.ws$.next(payload);
  }

  close(): void {
    this.ws$?.complete();
    this.ws$ = undefined;
  }
}
