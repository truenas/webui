import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TerminalConfiguration } from 'app/interfaces/terminal.interface';
import { shellElements } from 'app/pages/shell/shell.elements';

@Component({
  selector: 'ix-shell',
  templateUrl: './shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent implements TerminalConfiguration {
  protected readonly searchableElements = shellElements;
  connectionData = {};

  get conf(): typeof this {
    return this;
  }
}
