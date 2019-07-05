import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {UUID} from 'angular2-uuid';
import {LocalStorage} from 'ngx-webstorage';
import {Observable, Subject} from 'rxjs/Rx';

import {environment} from '../../environments/environment';
import { filter, map } from 'rxjs/operators';

@Injectable()
export class WebSocketService {

  private _authStatus: Subject<any>;
  onCloseSubject: Subject<any>;
  onOpenSubject: Subject<any>;
  pendingCalls: any;
  pendingSub: any;
  pendingMessages: any[] = [];
  socket: WebSocket;
  connected: boolean = false;
  loggedIn: boolean = false;
  @LocalStorage() token;
  redirectUrl: string = '';
  shuttingdown = false;

  protocol: any;
  remote: any;
  private consoleSub: Observable<string>;

  public subscriptions: Map<string, Array<any>> = new Map<string, Array<any>>();

  constructor(private _router: Router) {
    this._authStatus = new Subject();
    this.onOpenSubject = new Subject();
    this.onCloseSubject = new Subject();
    this.pendingCalls = new Map();
    this.protocol = window.location.protocol;
    this.remote = environment.remote;
    this.connect();
  }

  get authStatus(){
    return this._authStatus.asObservable();
  }

  get consoleMessages() {
    if (!this.consoleSub) {
      this.consoleSub = this.sub("filesystem.file_tail_follow:/var/log/messages:499").pipe(
        filter(res => res && res.data && typeof res.data === "string"),
        map(res => res.data)
      );
    }
    return this.consoleSub;
  }

  reconnect(protocol = window.location.protocol, remote = environment.remote) {
    this.protocol = protocol;
    this.remote = remote;
    this.socket.close();
  }

  connect() {
    this.socket = new WebSocket(
        (this.protocol == 'https:' ? 'wss://' : 'ws://') +
        this.remote + '/websocket');
    this.socket.onmessage = this.onmessage.bind(this);
    this.socket.onopen = this.onopen.bind(this);
    this.socket.onclose = this.onclose.bind(this);
  }

  onopen(event) {
    this.onOpenSubject.next(true);
    this.send({"msg" : "connect", "version" : "1", "support" : [ "1" ]});
  }

  onconnect() {
    this.shuttingdown = false;
    while (this.pendingMessages.length > 0) {
      let payload = this.pendingMessages.pop();
      this.send(payload);
    }
  }

  onclose(event) {
    this.connected = false;
    this.onCloseSubject.next(true);
    setTimeout(this.connect.bind(this), 5000);
    if (!this.shuttingdown) {
      this._router.navigate(['/sessions/signin']);
    }
  }

  ping() {
    if (this.connected) {
      this.socket.send(JSON.stringify({"msg" : "ping", "id" : UUID.UUID()}));
      if (this.token && typeof(this.token) !== 'undefined') {
        // check to see if the token is still valid (keepalive)
        this.call('auth.token', [ this.token ]).subscribe((result) => {
          if (!result && !this.shuttingdown) {
            this._router.navigate(['/sessions/signin']);
          }
        });
      }
      setTimeout(this.ping.bind(this), 20000);
    }
  }

  onmessage(msg) {
    try {
      var data = JSON.parse(msg.data);
    } catch (e) {
      console.warn(`Malformed response: "${msg.data}"`);
      return;
    }

    if (data.msg == "result") {
      let call = this.pendingCalls.get(data.id);

      this.pendingCalls.delete(data.id);
      if (data.error) {
        console.log("Error: ", data.error);
        call.observer.error(data.error);
      }
      if (call.observer) {
        call.observer.next(data.result);
        call.observer.complete();
      }
    } else if (data.msg == "connected") {
      this.connected = true;
      setTimeout(this.ping.bind(this), 20000);
      this.onconnect();
    } else if (data.msg == "added") {
      let subObserver = this.pendingSub;

      if (data.error) {
        console.log("Error: ", data.error);
        subObserver.error(data.error);
      }
      if (subObserver) {
        subObserver.next(data.fields);
      }
    } else if (data.msg == "changed") {
      this.subscriptions.forEach((v, k) => {
        if (k == '*' || k == data.collection) {
          v.forEach((item) => { item.next(data); });
        }
      });
    } else if (data.msg == "pong") {
      // pass
    } else if (data.msg == "sub") {
      // pass
    } else {
      // console.log("Unknown message: ", data);
    }
  }

  send(payload) {
    if (this.socket.readyState == WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    } else {
      this.pendingMessages.push(payload);
    }
  }

  subscribe(name): Observable<any> {
    let source = Observable.create((observer) => {
      if (this.subscriptions.has(name)) {
        this.subscriptions.get(name).push(observer);
      } else {
        this.subscriptions.set(name, [ observer ]);
      }
    });
    return source;
  }

  unsubscribe(observer) {
    // FIXME: just does not have a good performance :)
    this.subscriptions.forEach((v, k) => {
      v.forEach((item) => {
        if (item === observer) {
          v.splice(v.indexOf(item), 1);
        }
      });
    });
  }

  call(method, params?: any, debug = false): Observable<any> {

    let uuid = UUID.UUID();
    let payload =
        {"id" : uuid, "msg" : "method", "method" : method, "params" : params};
    let source = Observable.create((observer) => {
      this.pendingCalls.set(uuid, {
        "method" : method,
        "args" : params,
        "observer" : observer,
      });

      if (debug) {
        console.log({ payload });
      }

      this.send(payload);
    });

    return source;
  }

  sub(name): Observable<any> {

    let uuid = UUID.UUID();
    let payload =
        {"id" : uuid, "name" : name, "msg" : "sub" };

    let source = Observable.create((observer) => {
      this.pendingSub = observer;
      this.send(payload);      
    });

    return source;
  }

  job(method, params?: any): Observable<any> {
    let source = Observable.create((observer) => {
      this.call(method, params).subscribe((job_id) => {
        this.subscribe("core.get_jobs").subscribe((res) => {
          if (res.id == job_id) {
            observer.next(res.fields);
            if (res.fields.state == 'SUCCESS' || res.fields.state == 'FAILED') {
              observer.complete();
            }
          }
        });
      });
    });
    return source;
  }

  login(username, password): Observable<any> {
    return Observable.create((observer) => {
      this.call('auth.login', [ username, password ]).subscribe((result) => {
        this.loginCallback(result, observer);
      });
    });
  }

  loginCallback(result, observer) {
    if (result === true) {
      this.loggedIn = true;
      this._authStatus.next(this.loggedIn);
      
      // Subscribe to all events by default
      this.send({
        "id" : UUID.UUID(),
        "name" : "*",
        "msg" : "sub",
      });
    } else {
      this.loggedIn = false;
      this._authStatus.next(this.loggedIn);
    }
    observer.next(result);
    observer.complete();
  }

  login_token(token): Observable<any> {
    return Observable.create((observer) => {
      if(token) {
        this.call('auth.token', [ token ]).subscribe((result) => {
          this.loginCallback(result, observer);
        });
      }
    });
  }

  clearCredentials() {
    this.loggedIn = false;
    this.token = null;
    localStorage.removeItem('engineerMode');
  }

  prepare_shutdown() {
    this.shuttingdown = true;
    this.clearCredentials();
  }

  logout() {
    this.call('auth.logout').subscribe((res) => {
      this.clearCredentials();
      this.socket.close();
      this._router.navigate(['/sessions/signin']);
      (<any>window).location.reload();
    });
  }
}
