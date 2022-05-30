import { Component } from '@angular/core';
import { TerminalConfiguration } from 'app/interfaces/terminal.interface';

@Component({
  template: '<ix-terminal [conf]="this"></ix-terminal>',
})
export class ShellComponent implements TerminalConfiguration {
}
