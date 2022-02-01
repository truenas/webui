import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { UUID } from 'angular2-uuid';
import { LocalStorage } from 'ngx-webstorage';
import {
  Observable, Observer, Subject, Subscriber,
} from 'rxjs';
import { ApiEventMessage } from 'app/enums/api-event-message.enum';
import { JobState } from 'app/enums/job-state.enum';
import { ApiDirectory, ApiMethod } from 'app/interfaces/api-directory.interface';
import { ApiEventDirectory } from 'app/interfaces/api-event-directory.interface';
import { ApiEvent } from 'app/interfaces/api-event.interface';
import { LoginParams } from 'app/interfaces/auth.interface';
import { Job } from 'app/interfaces/job.interface';
import { environment } from '../../environments/environment';

@UntilDestroy()
@Injectable()
export class WebSocketService {
  private authStatus$: Subject<boolean>;
  onCloseSubject$: Subject<boolean>;
  onOpenSubject$: Subject<boolean>;
  pendingCalls: Map<string, {
    method: ApiMethod;
    args: unknown;
    observer: Subscriber<unknown>;
  }>;
  pendingSubs: {
    [name: string]: {
      observers: {
        [id: string]: Subscriber<unknown>;
      };
    };
  } = {};
  pendingMessages: unknown[] = [];
  socket: WebSocket;
  connected = false;
  loggedIn = false;
  @LocalStorage() token: string;
  redirectUrl = '';
  shuttingdown = false;

  protocol: string;
  remote: string;

  subscriptions = new Map<string, Observer<unknown>[]>();

  constructor(protected router: Router) {
    this.authStatus$ = new Subject<boolean>();
    this.onOpenSubject$ = new Subject();
    this.onCloseSubject$ = new Subject();
    this.pendingCalls = new Map();
    this.protocol = window.location.protocol;
    this.remote = environment.remote;
    this.connect();
  }

  get authStatus(): Observable<boolean> {
    return this.authStatus$.asObservable();
  }

  reconnect(protocol = window.location.protocol, remote = environment.remote): void {
    this.protocol = protocol;
    this.remote = remote;
    this.socket.close();
  }

  connect(): void {
    this.socket = new WebSocket(
      (this.protocol == 'https:' ? 'wss://' : 'ws://')
        + this.remote + '/websocket',
    );
    this.socket.onmessage = this.onmessage.bind(this);
    this.socket.onopen = this.onopen.bind(this);
    this.socket.onclose = this.onclose.bind(this);
  }

  onopen(): void {
    this.onOpenSubject$.next(true);
    this.send({ msg: ApiEventMessage.Connect, version: '1', support: ['1'] });
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
      this.socket.send(JSON.stringify({ msg: ApiEventMessage.Ping, id: UUID.UUID() }));
      setTimeout(() => this.ping(), 20000);
    }
  }

  onmessage(msg: { data: string }): void {
    let data: any;
    try {
      data = JSON.parse(msg.data);
    } catch (e: unknown) {
      console.warn(`Malformed response: "${msg.data}"`);
      return;
    }

    if (data.error && data.error == 13 /** Not Authenticated */) {
      return this.socket.close(); // will trigger onClose which handles redirection
    }

    if (data.msg == ApiEventMessage.Result) {
      const call = this.pendingCalls.get(data.id);

      this.pendingCalls.delete(data.id);
      if (data.error) {
        console.error('Error: ', data.error);
        call.observer.error(data.error);
      }
      if (call && call.observer) {
        call.observer.next(data.result);
        call.observer.complete();
      }
    } else if (data.msg == ApiEventMessage.Connected) {
      this.connected = true;
      setTimeout(() => this.ping(), 20000);
      this.onconnect();
    } else if (data.msg == ApiEventMessage.Changed || data.msg == ApiEventMessage.Added) {
      this.subscriptions.forEach((v, k) => {
        if (k == '*' || k == data.collection) {
          v.forEach((item) => { item.next(data); });
        }
      });
    } else
    // do nothing for pong or sub, otherwise console warn
    if (data.msg && (data.msg !== ApiEventMessage.Pong || data.msg !== ApiEventMessage.Sub)) {
      console.warn('Msg Received', data);
    } else {
      console.warn('Unknown message: ', data);
    }

    const collectionName = data.collection?.replace('.', '_');
    if (collectionName && this.pendingSubs[collectionName]?.observers) {
      for (const uuid in this.pendingSubs[collectionName].observers) {
        const subObserver = this.pendingSubs[collectionName].observers[uuid];
        if (data.error) {
          console.error('Error: ', data.error);
          subObserver.error(data.error);
        }
        if (subObserver && data.fields) {
          subObserver.next(data.fields);
        } else if (subObserver && !data.fields) {
          subObserver.next(data);
        }
      }
    }
  }

  send(payload: unknown): void {
    if (this.socket.readyState == WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    } else {
      this.pendingMessages.push(payload);
    }
  }

  subscribe<K extends keyof ApiEventDirectory>(name: K): Observable<ApiEvent<ApiEventDirectory[K]['response']>> {
    const source = Observable.create((observer: Subscriber<ApiEventDirectory[K]['response']>) => {
      if (this.subscriptions.has(name)) {
        this.subscriptions.get(name).push(observer);
      } else {
        this.subscriptions.set(name, [observer]);
      }
    });
    return source;
  }

  unsubscribe(observer: any): void {
    // FIXME: just does not have a good performance :)
    this.subscriptions.forEach((v) => {
      v.forEach((item) => {
        if (item === observer) {
          v.splice(v.indexOf(item), 1);
        }
      });
    });
  }

  call<K extends ApiMethod>(method: K, params?: ApiDirectory[K]['params']): Observable<ApiDirectory[K]['response']> {
    const uuid = UUID.UUID();
    const payload = {
      id: uuid, msg: ApiEventMessage.Method, method, params,
    };

    // Create the observable
    return new Observable((observer: Subscriber<ApiDirectory[K]['response']>) => {
      this.pendingCalls.set(uuid, {
        method,
        args: params,
        observer,
      });

      this.send(payload);
    });
  }

  /**
   * This method subscribes to the provided api end point for real time updates
   * @param api The api end point to subscribe to
   * @param subscriptionId The unique id that will be used as request id and can be
   * used to unsubscribe from the websocket subscription with the `unsub(api, subscriptionId)`
   * method
   * @returns
   */
  sub<T = any>(api: string, subscriptionId?: string): Observable<T> {
    const nom = api.replace('.', '_'); // Avoid weird behavior
    if (!this.pendingSubs[nom]) {
      this.pendingSubs[nom] = {
        observers: {},
      };
    }

    const uuid = subscriptionId || UUID.UUID();
    const payload = { id: uuid, name: api, msg: ApiEventMessage.Sub };
    return new Observable((observer: Subscriber<T>) => {
      this.pendingSubs[nom].observers[uuid] = observer;
      this.send(payload);

      // cleanup routine
      observer.complete = () => {
        this.send({ id: uuid, msg: ApiEventMessage.UnSub });
        this.pendingSubs[nom].observers[uuid].unsubscribe();
        delete this.pendingSubs[nom].observers[uuid];
        if (!this.pendingSubs[nom].observers) { delete this.pendingSubs[nom]; }
      };
      return observer;
    });
  }

  /**
   * This method unsubscribes from real time websocket updates to the given api end point
   * @param api The api end point to unsubscribe from
   * @param subscriptionId The subscription Id used to setup the subscription in the `sub(api, subscriptionId)` method
   */
  unsub(api: string, subscriptionId: string): void {
    const nom = api.replace('.', '_');
    if (this.pendingSubs[nom].observers[subscriptionId]) {
      this.send({ id: subscriptionId, msg: ApiEventMessage.UnSub });
      this.pendingSubs[nom].observers[subscriptionId].unsubscribe();
      delete this.pendingSubs[nom].observers[subscriptionId];
      if (!this.pendingSubs[nom].observers) {
        delete this.pendingSubs[nom];
      }
    }
  }

  job<K extends ApiMethod>(method: K, params?: ApiDirectory[K]['params']): Observable<Job<ApiDirectory[K]['response']>> {
    const source = Observable.create((observer: Subscriber<Job<ApiDirectory[K]['response']>>) => {
      this.call(method, params).pipe(untilDestroyed(this)).subscribe((jobId) => {
        this.subscribe('core.get_jobs').pipe(untilDestroyed(this)).subscribe((event) => {
          if (event.id == jobId) {
            observer.next(event.fields);
            if (event.fields.state === JobState.Success) observer.complete();
            if (event.fields.state === JobState.Failed) observer.error(event.fields);
          }
        });
      });
    });
    return source;
  }

  login(username: string, password: string, otpToken?: string): Observable<boolean> {
    const params: LoginParams = otpToken
      ? [username, password, otpToken]
      : [username, password];
    return Observable.create((observer: Subscriber<boolean>) => {
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
        msg: ApiEventMessage.Sub,
      });
    } else {
      this.loggedIn = false;
      this.authStatus$.next(this.loggedIn);
    }
    observer.next(result);
    observer.complete();
  }

  loginToken(token: string): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
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
      window.location.reload();
    });
  }
}
