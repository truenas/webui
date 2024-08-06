import { Terminal, IDisposable, ITerminalAddon } from '@xterm/xterm';
import { Subscription } from 'rxjs';
import { ShellService } from 'app/services/shell.service';

/**
 * This is basically the same as xterm-addon-attach
 * https://github.com/xtermjs/xterm.js/tree/master/addons/xterm-addon-attach
 * but it always sends messages as binary.
 */
export class XtermAttachAddon implements ITerminalAddon {
  private disposables: IDisposable[] = [];
  private subscriptions: Subscription[] = [];

  constructor(
    private shellService: ShellService,
  ) {}

  activate(terminal: Terminal): void {
    this.subscriptions.push(
      this.shellService.shellOutput$.subscribe((data) => {
        terminal.write(typeof data === 'string' ? data : new Uint8Array(data));
      }),
      this.shellService.shellConnected$.subscribe((event) => {
        if (!event.connected) {
          this.dispose();
        }
      }),
    );

    this.disposables.push(terminal.onData((data) => this.sendBinary(data)));
    this.disposables.push(terminal.onBinary((data) => this.sendBinary(data)));
  }

  dispose(): void {
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }

    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }

  private sendBinary(data: string): void {
    this.shellService.send(data);
  }
}
