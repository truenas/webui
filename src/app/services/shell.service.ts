import {
  Injectable, EventEmitter,
} from '@angular/core';
import { Router } from '@angular/router';
import { LocalStorage } from 'ngx-webstorage';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { ShellConnectedEvent } from '../interfaces/shell.interface';

@Injectable()
export class ShellService {
  onCloseSubject$: Subject<true> ;
  onOpenSubject$: Subject<true> ;
  pendingMessages: string[] = [];
  socket: WebSocket;
  connected = false;
  loggedIn = false;
  @LocalStorage() username: string;
  @LocalStorage() password: string;
  redirectUrl = '';
  token: string;
  vmId: number;
  podInfo: {
    chart_release_name: string;
    pod_name: string;
    container_name: string;
    command: string;
  };

  // input and output and eventEmmitter
  private shellCmdOutput: ArrayBuffer;
  shellOutput = new EventEmitter<ArrayBuffer>();
  shellConnected = new EventEmitter<ShellConnectedEvent>();

  constructor(private _router: Router) {
    this.onOpenSubject$ = new Subject();
    this.onCloseSubject$ = new Subject();
  }

  connect(): void {
    this.socket = new WebSocket(
      (window.location.protocol === 'https:' ? 'wss://' : 'ws://')
      + environment.remote + '/websocket/shell/',
    );
    this.socket.onmessage = this.onmessage.bind(this);
    this.socket.onopen = this.onopen.bind(this);
    this.socket.onclose = this.onclose.bind(this);
  }

  onopen(): void {
    this.onOpenSubject$.next(true);
    if (this.vmId) {
      this.send(JSON.stringify({ token: this.token, options: { vm_id: this.vmId } }));
    } else if (this.podInfo) {
      this.send(JSON.stringify({
        token: this.token,
        options: {
          chart_release_name: this.podInfo.chart_release_name,
          pod_name: this.podInfo.pod_name,
          container_name: this.podInfo.container_name,
          command: this.podInfo.command,
        },
      }));
    } else {
      this.send(JSON.stringify({ token: this.token }));
    }
  }

  onconnect(): void {
    while (this.pendingMessages.length > 0) {
      const payload = this.pendingMessages.pop();
      this.send(payload);
    }
  }

  // empty eventListener for attach socket
  addEventListener(): void {}

  onclose(): void {
    this.connected = false;
    this.onCloseSubject$.next(true);
    this.shellConnected.emit({
      connected: this.connected,
    });
  }

  onmessage(msg: MessageEvent): void {
    let data: any;

    try {
      data = JSON.parse(msg.data);
    } catch (error: unknown) {
      data = { msg: 'please discard this' };
    }

    if (data.msg === 'connected') {
      this.connected = true;
      this.onconnect();
      this.shellConnected.emit({
        connected: this.connected,
        id: data.id,
      });
      return;
    }

    if (!this.connected || data.msg === 'ping') {
      return;
    }

    this.shellCmdOutput = msg.data;
    this.shellOutput.emit(this.shellCmdOutput);
  }

  send(payload: string): void {
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(payload);
    } else {
      this.pendingMessages.push(payload);
    }
  }
}
