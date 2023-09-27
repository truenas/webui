import {
  Injectable, EventEmitter, Inject,
} from '@angular/core';
import { environment } from 'environments/environment';
import { WINDOW } from 'app/helpers/window.helper';
import { ShellConnectedEvent } from 'app/interfaces/shell.interface';

@Injectable()
export class ShellService {
  pendingMessages: string[] = [];
  socket: WebSocket;
  connected = false;
  token: string;
  vmId: number;
  private encoder = new TextEncoder();

  podInfo: {
    chart_release_name: string;
    pod_name: string;
    container_name: string;
    command: string;
  };

  private shellCmdOutput: ArrayBuffer;
  shellOutput = new EventEmitter<ArrayBuffer>();
  shellConnected = new EventEmitter<ShellConnectedEvent>();

  constructor(
    @Inject(WINDOW) private window: Window,
  ) {}

  connect(): void {
    this.socket = new WebSocket(
      (this.window.location.protocol === 'https:' ? 'wss://' : 'ws://')
        + environment.remote + '/websocket/shell/',
    );
    this.socket.onmessage = this.onmessage.bind(this);
    this.socket.onopen = this.onopen.bind(this);
    this.socket.onclose = this.onclose.bind(this);
  }

  onopen(): void {
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
    this.shellConnected.emit({
      connected: this.connected,
    });
  }

  onmessage(msg: MessageEvent<ArrayBuffer | string>): void {
    let data: { id?: string; msg: string };

    try {
      data = JSON.parse(msg.data as string) as { id?: string; msg: string };
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

    this.shellCmdOutput = msg.data as ArrayBuffer;
    this.shellOutput.emit(this.shellCmdOutput);
  }

  send(payload: string): void {
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(this.encoder.encode(payload));
    } else {
      this.pendingMessages.push(payload);
    }
  }
}
