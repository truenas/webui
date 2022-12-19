import { Inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { UUID } from 'angular2-uuid';
import { environment } from 'environments/environment';
import { LocalStorage } from 'ngx-webstorage';
import {
  defer,
  noop,
  Observable, Observer, Subject, Subscriber,
} from 'rxjs';
import {
  filter, finalize, map, share, switchMap,
} from 'rxjs/operators';
import { IncomingApiMessageType, OutgoingApiMessageType } from 'app/enums/api-message-type.enum';
import { JobState } from 'app/enums/job-state.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { ApiDirectory, ApiMethod } from 'app/interfaces/api-directory.interface';
import { ApiEventDirectory, LogsEventDirectory } from 'app/interfaces/api-event-directory.interface';
import {
  ApiEvent, IncomingWebsocketMessage, ResultMessage,
} from 'app/interfaces/api-message.interface';
import { LoginParams } from 'app/interfaces/auth.interface';
import { Job } from 'app/interfaces/job.interface';

// type ApiSubscriptionDirectory = ValuesType<ApiEventDirectory | LogsEventDirectory>['response'];

@UntilDestroy()
@Injectable()
export class WebSocketService {
  onCloseSubject$ = new Subject<boolean>();
  onOpenSubject$ = new Subject<boolean>();

  socket: WebSocket;
  connected = false;
  loggedIn = false;
  @LocalStorage() token: string;
  shuttingdown = false;

  private authStatus$ = new Subject<boolean>();
  private pendingCalls = new Map<string, {
    method: ApiMethod;
    args: unknown;
    observer: Subscriber<unknown>;
  }>();

  private pendingMessages: unknown[] = [];

  private protocol: string;
  private remote: string;

  private newSubscribers: {
    [endpoint: string]: {
      subscriptionId: string;
      subscriber$: Subject<ApiEvent<unknown>>;
      observable$: Observable<ApiEvent<unknown>>;
    };
  } = {};

  constructor(
    protected router: Router,
    @Inject(WINDOW) protected window: Window,
  ) {
    this.protocol = this.window.location.protocol;
    this.remote = environment.remote;
    this.connect();
  }

  get authStatus(): Observable<boolean> {
    return this.authStatus$.asObservable();
  }

  reconnect(protocol = this.window.location.protocol, remote = environment.remote): void {
    this.protocol = protocol;
    this.remote = remote;
    this.socket.close();
  }

  connect(): void {
    this.socket = new WebSocket(
      (this.protocol === 'https:' ? 'wss://' : 'ws://')
        + this.remote + '/websocket',
    );
    this.socket.onmessage = this.onmessage.bind(this);
    this.socket.onopen = this.onopen.bind(this);
    this.socket.onclose = this.onclose.bind(this);
  }

  onopen(): void {
    this.onOpenSubject$.next(true);
    this.send({ msg: OutgoingApiMessageType.Connect, version: '1', support: ['1'] });
  }

  onconnect(): void {
    this.shuttingdown = false;
    while (this.pendingMessages.length > 0) {
      const payload = this.pendingMessages.pop();
      this.send(payload);
    }
  }

  onclose(): void {
    this.connected = false;
    this.onCloseSubject$.next(true);
    setTimeout(() => this.connect(), 5000);
    if (!this.shuttingdown) {
      this.router.navigate(['/sessions/signin']);
    }
  }

  ping(): void {
    if (this.connected) {
      this.socket.send(JSON.stringify({ msg: OutgoingApiMessageType.Ping, id: UUID.UUID() }));
      setTimeout(() => this.ping(), 20000);
    }
  }

  onmessage(msg: { data: string }): void {
    const data: IncomingWebsocketMessage = this.parseIncomingData(msg);

    if (!data) {
      return;
    }

    if (this.hasAuthError(data)) {
      return this.triggerRedirectionWithOnClose();
    }

    switch (data.msg) {
      case IncomingApiMessageType.Result:
        return this.handleResultMessage(data);
      case IncomingApiMessageType.Connected:
        return this.handleConnectedMessage();
      case IncomingApiMessageType.Changed:
      case IncomingApiMessageType.Added:
      case IncomingApiMessageType.Removed:
        return this.handleSubEvent(data);
    }

    if (!Object.values(IncomingApiMessageType).includes(data.msg)) {
      return console.warn('Unknown message: ', data);
    }
  }

  /**
   *
   * @returns parsed IncomingWebsocketMessage object or null in case of malformed JSON string
   */
  parseIncomingData(msg: { data: string }): IncomingWebsocketMessage {
    let data: IncomingWebsocketMessage;
    try {
      data = JSON.parse(msg.data);
      return data;
    } catch (error: unknown) {
      console.warn(`Malformed response: "${msg.data}"`);
      return null;
    }
  }

  hasAuthError(data: IncomingWebsocketMessage): boolean {
    return 'error' in data && data.error.error === 13;
  }

  triggerRedirectionWithOnClose(): void {
    this.socket.close();
  }

  handleResultMessage(data: ResultMessage<unknown>): void {
    const call = this.pendingCalls.get(data.id);
    this.pendingCalls.delete(data.id);
    if (data.error) {
      console.error('Error: ', data.id, data.error);
      call?.observer?.error(data.error);
    }
    if (call && call.observer) {
      call.observer.next(data.result);
      call.observer.complete();
    }
  }

  handleConnectedMessage(): void {
    this.connected = true;
    setTimeout(() => this.ping(), 20000);
    this.onconnect();
  }

  handleSubEvent(data: ApiEvent<unknown>): void {
    const collectionName = (data).collection?.replace('.', '_');
    if (collectionName && this.newSubscribers[collectionName]?.subscriber$) {
      if ('error' in data && data.error) {
        this.newSubscribers[collectionName]?.subscriber$.error(data.error);
      }
      this.newSubscribers[collectionName]?.subscriber$.next(data);
    }
  }

  send(payload: unknown): void {
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    } else {
      this.pendingMessages.push(payload);
    }
  }

  call<K extends ApiMethod>(method: K, params?: ApiDirectory[K]['params']): Observable<ApiDirectory[K]['response']> {
    const uuid = UUID.UUID();
    const payload = {
      id: uuid, msg: OutgoingApiMessageType.Method, method, params,
    };

    // Create the observable
    return new Observable((observer: Subscriber<ApiDirectory[K]['response']>) => {
      this.pendingCalls.set(uuid, {
        method,
        args: params,
        observer,
      });

      this.send(payload);
    }).pipe(share());
  }

  /**
   * @param endpoint The end point to subscribe to for updates
   * @returns An observable which keep tracks of its subscribers,
   * and will unsubscribe from the middleware endpoint on its own
   * when no subscriptions are active
   */
  newSub<K extends keyof ApiEventDirectory>(apiMethod: K | string): Observable<ApiEvent<ApiEventDirectory[K]['response'] & LogsEventDirectory[K]['response']>> {
    const endpoint = apiMethod.replace('.', '_'); // Avoid weird behavior
    if (this.newSubscribers[endpoint]?.observable$) {
      return this.newSubscribers[endpoint].observable$ as Observable<ApiEvent<ApiEventDirectory[K]['response'] & LogsEventDirectory[K]['response']>>;
    }

    const subscriber$ = new Subject<ApiEvent<ApiEventDirectory[K]['response'] & LogsEventDirectory[K]['response']>>();
    const subscriptionId = UUID.UUID();
    const payload = {
      id: subscriptionId,
      name: endpoint,
      msg: OutgoingApiMessageType.Sub,
    };
    this.send(payload);

    const countedObservable$ = subscriber$.pipe(
      this.subCounterOperator((noOfSubs: number) => {
        if (noOfSubs === 0) {
          this.send({ id: subscriptionId, msg: OutgoingApiMessageType.UnSub });
          this.newSubscribers[endpoint].subscriber$.complete();
          delete this.newSubscribers[endpoint];
        }
      }),
    );
    this.newSubscribers[endpoint] = { subscriptionId, subscriber$, observable$: countedObservable$ };

    return countedObservable$;
  }

  subCounterOperator<T>(onCountUpdate: (n: number) => void = noop) {
    return function refCountOperatorFunction(source$: Subject<ApiEvent<T>>) {
      let counter = 0;

      return defer(() => {
        counter++;
        onCountUpdate(counter);
        return source$;
      })
        .pipe(
          finalize(() => {
            counter--;
            onCountUpdate(counter);
          }),
        );
    };
  }

  job<K extends ApiMethod>(method: K, params?: ApiDirectory[K]['params']): Observable<Job<ApiDirectory[K]['response']>> {
    return new Observable((observer: Subscriber<Job<ApiDirectory[K]['response']>>) => {
      this.call(method, params).pipe(
        switchMap((jobId) => this.newSub('core.get_jobs').pipe(filter((event) => event.id === jobId))),
        map((event) => event as ApiEvent<Job<unknown, unknown[]>>),
        untilDestroyed(this),
      ).subscribe({
        next: (event) => {
          observer.next(event.fields);
          if (event.fields.state === JobState.Success) observer.complete();
          if (event.fields.state === JobState.Failed) observer.error(event.fields);
        },
        error: (error) => {
          observer.error(error);
        },
      });
    });
  }

  login(username: string, password: string, otpToken?: string): Observable<boolean> {
    const params: LoginParams = otpToken ? [username, password, otpToken] : [username, password];

    return new Observable((observer: Subscriber<boolean>) => {
      this.call('auth.login', params).pipe(untilDestroyed(this)).subscribe((wasLoggedIn) => {
        this.loginCallback(wasLoggedIn, observer);
      });
    });
  }

  loginCallback(result: boolean, observer: Observer<boolean>): void {
    if (result) {
      if (!this.loggedIn) {
        this.authStatus$.next(this.loggedIn);
      }

      this.loggedIn = true;

      // Subscribe to all events by default
      this.send({
        id: UUID.UUID(),
        name: '*',
        msg: OutgoingApiMessageType.Sub,
      });
    } else {
      this.loggedIn = false;
      this.authStatus$.next(this.loggedIn);
    }
    observer.next(result);
    observer.complete();
  }

  loginToken(token: string): Observable<boolean> {
    return new Observable((observer: Subscriber<boolean>) => {
      if (token) {
        this.call('auth.token', [token]).pipe(untilDestroyed(this)).subscribe((result) => {
          this.loginCallback(result, observer);
        });
      }
    });
  }

  clearCredentials(): void {
    this.loggedIn = false;
    this.token = null;
  }

  prepareShutdown(): void {
    this.shuttingdown = true;
    this.clearCredentials();
  }

  logout(): void {
    this.call('auth.logout').pipe(untilDestroyed(this)).subscribe(() => {
      this.clearCredentials();
      this.socket.close();
      this.router.navigate(['/sessions/signin']);
      this.window.location.reload();
    });
  }
}
