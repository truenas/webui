import { Component } from '@angular/core';
import { TerminalConfiguration } from 'app/interfaces/terminal.interface';

@Component({
  selector: 'app-shell',
  template: '<terminal [conf]="this"></terminal>',
})
export class ShellComponent implements TerminalConfiguration {
}
