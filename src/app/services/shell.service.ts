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
  private shellCmdOutput: any;
  @Output() shellOutput = new EventEmitter < any > ();

  public subscriptions: Map < string, Array < any >> = new Map < string, Array < any >> ();

  constructor(private _router: Router) {
    this.onOpenSubject = new Subject();
    this.onCloseSubject = new Subject();
    this.pendingCalls = new Map();
  }

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
    this.send(JSON.stringify({ "token": this.token }));
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


  onmessage(msg) {
    let data: any;

    console.log("-----service:", msg.data);

    try {
      data = JSON.parse(msg.data);
    } catch (e) {
      data = { 'msg': 'please discard this' };
    }

    if (data.msg == "connected") {
      this.connected = true;
      this.onconnect();
      return;
    }

    if (!this.connected) {
      return;
    }
    if (data.msg === "ping") {} else {
      this.shellCmdOutput = msg.data;
      this.shellOutput.emit(this.shellCmdOutput);
    }
  }

  send(payload) {
    if (this.socket.readyState == WebSocket.OPEN) {
      this.socket.send(payload);
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

}
