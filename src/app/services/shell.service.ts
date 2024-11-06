import {
  Injectable, EventEmitter, Inject,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { environment } from 'environments/environment';
import { tap } from 'rxjs';
import { webSocket as rxjsWebSocket, WebSocketSubject } from 'rxjs/webSocket';
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
    @Inject(WEBSOCKET) private webSocket: typeof rxjsWebSocket,
  ) {}

  connect(connectionData: TerminalConnectionData, token: string): void {
    this.disconnectIfSessionActive();

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
          app_name: connectionData.podInfo.chartReleaseName,
          container_id: connectionData.podInfo.containerId,
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
    let data: { id?: string; msg: IncomingApiMessageType };

    try {
      data = JSON.parse(msg.data as string) as { id?: string; msg: IncomingApiMessageType };
    } catch (error: unknown) {
      // TODO: Figure out why we need this.
      data = { msg: IncomingApiMessageType.Discard } as { id?: string; msg: IncomingApiMessageType };
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

  disconnectIfSessionActive(): void {
    if (this.ws$ && !this.ws$.closed) {
      this.ws$.complete();
    }
  }
}
