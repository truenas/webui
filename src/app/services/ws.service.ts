import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { UUID } from 'angular2-uuid';
import { LocalStorage } from 'ngx-webstorage';
import { Observable, Observer, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
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
  pendingCalls: Map<string, any>;
  pendingSubs: any = {};
  pendingMessages: unknown[] = [];
  socket: WebSocket;
  connected = false;
  loggedIn = false;
  @LocalStorage() token: string;
  redirectUrl = '';
  shuttingdown = false;

  protocol: string;
  remote: string;
  private consoleSub$: Observable<string>;

  subscriptions: Map<string, any[]> = new Map<string, any[]>();

  constructor(private router: Router) {
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

  get consoleMessages(): Observable<string> {
    if (!this.consoleSub$) {
      this.consoleSub$ = this.sub('filesystem.file_tail_follow:/var/log/messages:499').pipe(
        filter((res) => res && res.data && typeof res.data === 'string'),
        map((res) => res.data),
      );
    }
    return this.consoleSub$;
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
    this.send({ msg: 'connect', version: '1', support: ['1'] });
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
      this.socket.send(JSON.stringify({ msg: 'ping', id: UUID.UUID() }));
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

    if (data.msg == ApiEventMessage.Result) {
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
    } else if (data.msg == 'connected') {
      this.connected = true;
      setTimeout(() => this.ping(), 20000);
      this.onconnect();
    } else if (data.msg == 'nosub') {
      console.warn(data);
    } else if (data.msg == ApiEventMessage.Added || data.collection == 'disk.query') {
      const nom = data.collection.replace('.', '_');
      if (this.pendingSubs[nom] && this.pendingSubs[nom].observers) {
        for (const uuid in this.pendingSubs[nom].observers) {
          const subObserver = this.pendingSubs[nom].observers[uuid];
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
    } else if (data.msg == ApiEventMessage.Changed) {
      this.subscriptions.forEach((v, k) => {
        if (k == '*' || k == data.collection) {
          v.forEach((item) => { item.next(data); });
        }
      });
    } else if (data.msg == 'pong') {
      // pass
    } else if (data.msg == 'sub') {
      // pass
    } else {
      console.warn('Unknown message: ', data);
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
    const source = Observable.create((observer: any) => {
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
      id: uuid, msg: 'method', method, params,
    };

    // Create the observable
    return new Observable((observer: any) => {
      this.pendingCalls.set(uuid, {
        method,
        args: params,
        observer,
      });

      this.send(payload);
    });
  }

  sub<T = any>(name: string): Observable<T> {
    const nom = name.replace('.', '_'); // Avoid weird behavior
    if (!this.pendingSubs[nom]) {
      this.pendingSubs[nom] = {
        observers: {},
      };
    }

    const uuid = UUID.UUID();
    const payload = { id: uuid, name, msg: 'sub' };

    const obs = Observable.create((observer: any) => {
      this.pendingSubs[nom].observers[uuid] = observer;
      this.send(payload);

      // cleanup routine
      observer.complete = () => {
        const unsub_payload = { id: uuid, msg: 'unsub' };
        this.send(unsub_payload);
        this.pendingSubs[nom].observers[uuid].unsubscribe();
        delete this.pendingSubs[nom].observers[uuid];
        if (!this.pendingSubs[nom].observers) { delete this.pendingSubs[nom]; }
      };

      return observer;
    });
    return obs;
  }

  job<K extends ApiMethod>(method: K, params?: ApiDirectory[K]['params']): Observable<Job<ApiDirectory[K]['response']>> {
    const source = Observable.create((observer: any) => {
      this.call(method, params).pipe(untilDestroyed(this)).subscribe((job_id) => {
        this.subscribe('core.get_jobs').pipe(untilDestroyed(this)).subscribe((event) => {
          if (event.id == job_id) {
            observer.next(event.fields);
            if (event.fields.state === JobState.Success) observer.complete();
            if (event.fields.state === JobState.Failed) observer.error(event.fields);
          }
        });
      });
    });
    return source;
  }

  login(username: string, password: string, otp_token?: string): Observable<boolean> {
    const params: LoginParams = otp_token
      ? [username, password, otp_token]
      : [username, password];
    return Observable.create((observer: Observer<boolean>) => {
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
        msg: 'sub',
      });
    } else {
      this.loggedIn = false;
      this.authStatus$.next(this.loggedIn);
    }
    observer.next(result);
    observer.complete();
  }

  loginToken(token: string): Observable<boolean> {
    return Observable.create((observer: Observer<boolean>) => {
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
