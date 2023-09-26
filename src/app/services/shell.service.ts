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
import { TerminalConnectionData } from 'app/interfaces/terminal.interface';

@UntilDestroy()
@Injectable()
export class ShellService {
  private encoder = new TextEncoder();
  private ws$: WebSocketSubject<unknown>;
  private connectionUrl = (this.window.location.protocol === 'https:' ? 'wss://' : 'ws://') + environment.remote + '/websocket/shell/';
  private isConnected = false;

  private shellOutput = new EventEmitter<ArrayBuffer>();
  private shellConnected = new EventEmitter<ShellConnectedEvent>();

  readonly shellOutput$ = this.shellOutput.asObservable();
  readonly shellConnected$ = this.shellConnected.asObservable();

  constructor(
    @Inject(WINDOW) private window: Window,
    @Inject(WEBSOCKET) private webSocket: typeof rxjsWebsocket,
  ) {}

  connect(connectionData: TerminalConnectionData, token: string): void {
    this.disconnect();

    this.ws$ = this.webSocket({
      url: this.connectionUrl,
      openObserver: {
        next: () => this.onOpen(connectionData, token),
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
      },
    });
  }

  private onOpen(connectionData: TerminalConnectionData, token: string): void {
    if (connectionData.vmId) {
      this.ws$.next(JSON.stringify({ token, options: { vm_id: connectionData.vmId } }));
    } else if (connectionData.podInfo) {
      this.ws$.next(JSON.stringify({
        token,
        options: {
          chart_release_name: connectionData.podInfo.chartReleaseName,
          pod_name: connectionData.podInfo.podName,
          container_name: connectionData.podInfo.containerName,
          command: connectionData.podInfo.command,
        },
      }));
    } else {
      this.ws$.next(JSON.stringify({ token }));
    }
  }

  private onClose(): void {
    this.shellConnected.emit({
      connected: false,
    });
  }

  private onMessage(msg: MessageEvent<ArrayBuffer | string>): void {
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

  send(data: string): void {
    if (this.isConnected) {
      const buffer = this.encoder.encode(data);
      this.ws$.next(buffer);
    }
  }

  disconnect(): void {
    if (this.ws$ && !this.ws$.closed) {
      this.ws$.complete();
    }
  }
}
