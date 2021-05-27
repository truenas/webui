import { Terminal, IDisposable, ITerminalAddon } from 'xterm';

/**
 * This is basically the same as xterm-addon-attach
 * https://github.com/xtermjs/xterm.js/tree/master/addons/xterm-addon-attach
 * but it always sends messages as binary.
 */
export class XtermAttachAddon implements ITerminalAddon {
  private readonly socket: WebSocket;
  private disposables: IDisposable[] = [];
  private encoder = new TextEncoder();

  constructor(socket: WebSocket) {
    this.socket = socket;
    // always set binary type to arraybuffer, we do not handle blobs
    this.socket.binaryType = 'arraybuffer';
  }

  activate(terminal: Terminal): void {
    this.disposables.push(
      addSocketListener(this.socket, 'message', (event) => {
        const data: ArrayBuffer | string = event.data;
        terminal.write(typeof data === 'string' ? data : new Uint8Array(data));
      }),
    );

    this.disposables.push(terminal.onData((data) => this.sendBinary(data)));
    this.disposables.push(terminal.onBinary((data) => this.sendBinary(data)));

    this.disposables.push(addSocketListener(this.socket, 'close', () => this.dispose()));
    this.disposables.push(addSocketListener(this.socket, 'error', () => this.dispose()));
  }

  dispose(): void {
    for (const d of this.disposables) {
      d.dispose();
    }
  }

  private sendBinary(data: string): void {
    if (this.socket.readyState !== 1) {
      return;
    }
    const buffer = this.encoder.encode(data);
    this.socket.send(buffer);
  }
}

function addSocketListener<K extends keyof WebSocketEventMap>(
  socket: WebSocket,
  type: K,
  handler: (this: WebSocket, ev: WebSocketEventMap[K]) => unknown,
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
