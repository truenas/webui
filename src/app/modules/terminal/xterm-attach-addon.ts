import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Terminal, IDisposable, ITerminalAddon } from 'xterm';
import { ShellService } from 'app/services/shell.service';

/**
 * This is basically the same as xterm-addon-attach
 * https://github.com/xtermjs/xterm.js/tree/master/addons/xterm-addon-attach
 * but it always sends messages as binary.
 */
@UntilDestroy()
export class XtermAttachAddon implements ITerminalAddon {
  private disposables: IDisposable[] = [];
  private encoder = new TextEncoder();

  constructor(
    private shellService: ShellService,
  ) {}

  activate(terminal: Terminal): void {
    this.shellService.shellOutput.pipe(untilDestroyed(this)).subscribe((data) => {
      terminal.write(typeof data === 'string' ? data : new Uint8Array(data));
    });

    this.disposables.push(terminal.onData((data) => this.sendBinary(data)));
    this.disposables.push(terminal.onBinary((data) => this.sendBinary(data)));

    this.shellService.shellConnected.pipe(untilDestroyed(this)).subscribe((event) => {
      if (!event.connected) {
        this.dispose();
      }
    });
  }

  dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }

  private sendBinary(data: string): void {
    const buffer = this.encoder.encode(data);
    this.shellService.send(buffer);
  }
}
