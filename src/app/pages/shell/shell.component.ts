import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { TerminalConfiguration } from 'app/interfaces/terminal.interface';
import { TerminalComponent } from 'app/modules/terminal/components/terminal/terminal.component';
import { shellElements } from 'app/pages/shell/shell.elements';

@Component({
  selector: 'ix-shell',
  templateUrl: './shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [UiSearchDirective, TerminalComponent],
})
export class ShellComponent implements TerminalConfiguration {
  protected readonly searchableElements = shellElements;
  connectionData = {};

  get conf(): typeof this {
    return this;
  }
}
