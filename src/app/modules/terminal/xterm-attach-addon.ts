/* eslint-disable no-console */
import { Terminal, IDisposable, ITerminalAddon } from 'xterm';

interface IAttachOptions {
  bidirectional?: boolean;
}

/**
 * This is basically the same as xterm-addon-attach
 * https://github.com/xtermjs/xterm.js/tree/master/addons/xterm-addon-attach
 * but it always sends messages as binary.
 */
export class XtermAttachAddon implements ITerminalAddon {
  private socket: WebSocket;
  private bidirectional: boolean;
  private disposables: IDisposable[] = [];

  constructor(socket: WebSocket, options?: IAttachOptions) {
    this.socket = socket;
    // always set binary type to arraybuffer, we do not handle blobs
    this.socket.binaryType = 'arraybuffer';
    this.bidirectional = !(options && !options.bidirectional);
  }

  activate(terminal: Terminal): void {
    this.disposables.push(
      addSocketListener(this.socket, 'message', (event) => {
        const data: ArrayBuffer | string = event.data;
        let transformedData: string;
        if (typeof data === 'string') {
          transformedData = data;
        } else {
          const decoder = new TextDecoder('utf-8');
          transformedData = decoder.decode(data);
        }

        terminal.write(transformedData);
      }),
    );

    if (this.bidirectional) {
      // Main change is here, we always send binary data
      this.disposables.push(terminal.onData((data) => this.sendBinary(data)));
      this.disposables.push(terminal.onBinary((data) => this.sendBinary(data)));
    }

    this.disposables.push(addSocketListener(this.socket, 'close', () => this.dispose()));
    this.disposables.push(addSocketListener(this.socket, 'error', () => this.dispose()));
  }

  dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }

  private sendData(data: string): void {
    if (!this.checkOpenSocket()) {
      return;
    }
    this.socket.send(data);
  }

  private sendBinary(data: string): void {
    if (!this.checkOpenSocket()) {
      return;
    }
    const buffer = new Uint8Array(data.length);
    for (let i = 0; i < data.length; ++i) {
      buffer[i] = data.charCodeAt(i) & 255;
    }
    this.socket.send(buffer);
  }

  private checkOpenSocket(): boolean {
    switch (this.socket.readyState) {
      case WebSocket.OPEN:
        return true;
      case WebSocket.CONNECTING:
        throw new Error('Attach addon was loaded before socket was open');
      case WebSocket.CLOSING:
        console.warn('Attach addon socket is closing');
        return false;
      case WebSocket.CLOSED:
        throw new Error('Attach addon socket is closed');
      default:
        throw new Error('Unexpected socket state');
    }
  }
}

function addSocketListener<K extends keyof WebSocketEventMap>(
  socket: WebSocket, type: K, handler: (this: WebSocket, ev: WebSocketEventMap[K]) => unknown,
): IDisposable {
  socket.addEventListener(type, handler);
  return {
    dispose: () => {
      if (!handler) {
        // Already disposed
        return;
      }
      socket.removeEventListener(type, handler);
    },
  };
}
