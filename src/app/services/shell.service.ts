import { Injectable, EventEmitter, Output, Input } from '@angular/core';
import { Router } from '@angular/router';
import { UUID } from 'angular2-uuid';
import { LocalStorage } from 'ng2-webstorage';
import { Observable, Subject, Subscription } from 'rxjs/Rx';

import { environment } from '../../environments/environment';

@Injectable()
export class ShellService {

  onCloseSubject: Subject < any > ;
  onOpenSubject: Subject < any > ;
  pendingCalls: any;
  pendingMessages: any[] = [];
  socket: WebSocket;
  connected: boolean = false;
  loggedIn: boolean = false;
  @LocalStorage() username;
  @LocalStorage() password;
  redirectUrl: string = '';
  public token: string;

  //input and output and eventEmmitter
  // private userCmd = '';
  private shellCmdOutput: any;
  @Output() shellOutput = new EventEmitter < any > ();

  public subscriptions: Map < string, Array < any >> = new Map < string, Array < any >> ();

  constructor(private _router: Router) {
    this.onOpenSubject = new Subject();
    this.onCloseSubject = new Subject();
    this.pendingCalls = new Map();
  }

  // public runCmd(user_input) {
  //   this.call(user_input).subscribe((res) => {
  //     this.shellOutput.emit(res);
  //   });
  // }

  connect() {
    this.socket = new WebSocket(
      (window.location.protocol == 'https:' ? 'wss://' : 'ws://') +
      environment.remote + '/websocket/shell/');
    this.socket.onmessage = this.onmessage.bind(this);
    this.socket.onopen = this.onopen.bind(this);
    this.socket.onclose = this.onclose.bind(this);
  }

  onopen(event) {
    this.onOpenSubject.next(true);
    this.send({ "token": this.token });
  }

  onconnect() {
    while (this.pendingMessages.length > 0) {
      let payload = this.pendingMessages.pop();
      this.send(payload);
    }
  }

  //empty eventListener for attach socket
  addEventListener() {}

  onclose(event) {
    this.connected = false;
    this.onCloseSubject.next(true);
    setTimeout(this.connect.bind(this), 5000);
    this._router.navigate(['/login']);
  }

  ping() {
    if (this.connected) {
      this.socket.send(JSON.stringify({ "msg": "ping", "id": UUID.UUID() }));
      setTimeout(this.ping.bind(this), 20000);
    }
  }

  onmessage(msg) {
    let data: any;
    let shellMsg: string;

    try {
      data = JSON.parse(msg.data);
    } catch (e) {
      // just the response from shell
      shellMsg = msg.data;
      data = {'msg': 'lol'};
    }

    if (data.msg == "connected") {
      this.connected = true;
      setTimeout(this.ping.bind(this), 20000);
      this.onconnect();
      return;
    }

    if (!this.connected) {
      return;
    }
    if (data.msg == "ping" || data.msgg == "ping") {
      // pass;
    } else {
      // console.log("Unknown message: ", data);
      this.shellCmdOutput = shellMsg;
      console.log("hey xin" , shellMsg);
      this.shellOutput.emit(this.shellCmdOutput);
    }
  }

  send(payload) {
    if (this.socket.readyState == WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    } else {
      this.pendingMessages.push(payload);
    }
  }

  subscribe(name): Observable < any > {
    let source = Observable.create((observer) => {
      if (this.subscriptions.has(name)) {
        this.subscriptions.get(name).push(observer);
      } else {
        this.subscriptions.set(name, [observer]);
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

  call(method, params ? : any): Observable < any > {

    let uuid = UUID.UUID();
    let payload = { "id": uuid, "msg": "method", "method": method, "params": params };

    let source = Observable.create((observer) => {
      this.pendingCalls.set(uuid, {
        "method": method,
        "args": params,
        "observer": observer,
      });

      this.send(payload);
    });

    return source;
  }

  job(method, params ? : any): Observable < any > {
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

  login(username, password): Observable < any > {
    this.username = username;
    this.password = password;
    return Observable.create((observer) => {
      this.call('auth.login', [username, password]).subscribe((result) => {
        if (result === true) {
          this.loggedIn = true;

          // Subscribe to all events by default
          this.send({
            "id": UUID.UUID(),
            "name": "*",
            "msg": "sub",
          });
        } else {
          this.loggedIn = false;
        }
        observer.next(result);
        observer.complete();
      });
    });
  }

  logout() {
    this.loggedIn = false;
    this.username = '';
    this.password = '';
    this._router.navigate(['/login']);
  }
}
