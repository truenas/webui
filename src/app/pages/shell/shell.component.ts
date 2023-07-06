import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TerminalConfiguration } from 'app/interfaces/terminal.interface';

@Component({
  template: '<ix-terminal [conf]="this"></ix-terminal>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent implements TerminalConfiguration {
}
