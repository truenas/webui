import { Component } from '@angular/core';
import { TerminalConfiguration } from 'app/interfaces/terminal.interface';

@Component({
  selector: 'app-shell',
  template: '<app-terminal [conf]="this"></app-terminal>',
})
export class ShellComponent implements TerminalConfiguration {
}
