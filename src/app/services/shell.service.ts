import {
  Injectable, EventEmitter, Inject,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { environment } from 'environments/environment';
import { tap } from 'rxjs';
import { webSocket as rxjsWebsocket, WebSocketSubject } from 'rxjs/webSocket';
import { IncomingApiMessageType } from 'app/enums/api-message-type.enum';
import { WEBSOCKET } from 'app/helpers/websocket.helper';
import { WINDOW } from 'app/helpers/window.helper';
import { ShellConnectedEvent } from 'app/interfaces/shell.interface';

@UntilDestroy()
@Injectable()
export class ShellService {
  private pendingMessages: Uint8Array[] = [];
  private ws$: WebSocketSubject<unknown>;
  private connectionUrl = (this.window.location.protocol === 'https:' ? 'wss://' : 'ws://') + environment.remote + '/websocket/shell/';
  private isConnected = false;

  token: string;
  vmId: number;
  podInfo: {
    chart_release_name: string;
    pod_name: string;
    container_name: string;
    command: string;
  };

  shellOutput = new EventEmitter<ArrayBuffer>();
  shellConnected = new EventEmitter<ShellConnectedEvent>();

  constructor(
    @Inject(WINDOW) private window: Window,
    @Inject(WEBSOCKET) private webSocket: typeof rxjsWebsocket,
  ) {}

  connect(): void {
    this.closeWebsocketConnection();

    this.ws$ = this.webSocket({
      url: this.connectionUrl,
      openObserver: {
        next: this.onOpen.bind(this),
      },
      closeObserver: {
        next: this.onClose.bind(this),
      },
      serializer: (msg) => msg as string | ArrayBuffer,
      deserializer: (msg) => msg,
      binaryType: 'arraybuffer',
    });

    this.ws$.pipe(
      tap((response: MessageEvent<ArrayBuffer | string>) => {
        this.onMessage(response);
      }),
      untilDestroyed(this),
    ).subscribe();

    this.shellConnected.pipe(untilDestroyed(this)).subscribe({
      next: (event) => {
        this.isConnected = event.connected;
        if (event.connected) {
          this.onConnect();
        }
      },
    });
  }

  onOpen(): void {
    if (this.vmId) {
      this.ws$.next(JSON.stringify({ token: this.token, options: { vm_id: this.vmId } }));
    } else if (this.podInfo) {
      this.ws$.next(JSON.stringify({
        token: this.token,
        options: {
          chart_release_name: this.podInfo.chart_release_name,
          pod_name: this.podInfo.pod_name,
          container_name: this.podInfo.container_name,
          command: this.podInfo.command,
        },
      }));
    } else {
      this.ws$.next(JSON.stringify({ token: this.token }));
    }
  }

  onConnect(): void {
    while (this.pendingMessages.length > 0) {
      const payload = this.pendingMessages.pop();
      this.send(payload);
    }
  }

  onClose(): void {
    this.shellConnected.emit({
      connected: false,
    });
  }

  onMessage(msg: MessageEvent<ArrayBuffer | string>): void {
    let data: { id?: string; msg: string };

    try {
      data = JSON.parse(msg.data as string) as { id?: string; msg: string };
    } catch (error: unknown) {
      data = { msg: 'please discard this' };
    }

    if (data.msg === IncomingApiMessageType.Connected) {
      this.shellConnected.emit({
        connected: true,
        id: data.id,
      });
      return;
    }

    if (!this.isConnected || data.msg === IncomingApiMessageType.Pong) {
      return;
    }

    this.shellOutput.emit(msg.data as ArrayBuffer);
  }

  send(payload: Uint8Array): void {
    if (this.isConnected) {
      this.ws$.next(payload);
    } else {
      this.pendingMessages.push(payload);
    }
  }

  closeWebsocketConnection(): void {
    if (this.ws$) {
      this.ws$.complete();
    }
  }
}
