import {
  Injectable, EventEmitter, Inject,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { environment } from 'environments/environment';
import { tap } from 'rxjs';
import { webSocket as rxjsWebSocket, WebSocketSubject } from 'rxjs/webSocket';
import { ShellMessageType } from 'app/enums/api.enum';
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

  connect(token: string, connectionData: TerminalConnectionData): void {
    this.disconnectIfSessionActive();

    this.ws$ = this.webSocket({
      url: this.connectionUrl,
      openObserver: {
        next: () => this.onOpen(token, connectionData),
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

  private onOpen(token: string, connectionData: TerminalConnectionData): void {
    this.ws$.next(JSON.stringify({ token, options: connectionData }));
  }

  private onClose(): void {
    this.shellConnected.emit({
      connected: false,
    });
  }

  private onMessage(msg: MessageEvent<ArrayBuffer | string>): void {
    if (typeof msg.data === 'string') {
      try {
        const data = JSON.parse(msg.data) as { id?: string; msg: ShellMessageType };
        if (data.msg === ShellMessageType.Connected) {
          this.shellConnected.emit({
            connected: true,
            id: data.id,
          });
          return;
        }
      } catch (error: unknown) {
        console.error('Failed to parse shell message', error);
      }
    }

    if (!this.isConnected) {
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
