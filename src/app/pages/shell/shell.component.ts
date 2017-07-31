import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnChanges,
  Input,
  Output,
  EventEmitter,
  SimpleChange
} from '@angular/core';
import { Subscription } from 'rxjs';

import { WebSocketService, ShellService } from '../../services/';
import * as xterm from "xterm";
import * as Terminal from 'xterm/dist/xterm';
import 'xterm/dist/addons/fit/fit.js';

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  providers: [ShellService],
})

export class ShellComponent implements OnInit, OnChanges {
  // This Xterm implementation emits all commands, once the users presses 'Enter'
  @Output() stdin: EventEmitter < string > = new EventEmitter < string > ();
  // waits for events that should be printed on the terminal
  @Input() stdout: EventEmitter < string > ;
  // sets the shell prompt
  @Input() prompt: string = '';
  //xter container
  @ViewChild('terminal') container: ElementRef;

  // handle up/down command history functionality
  history: any = [];
  historyIndex: number;
  last: number;

  // caches stdin, until the user presses Enter
  buffer: string = '';

  // xterm variables
  terminalContainer: any;
  term: any;
  optionElements: any;
  cols: string;
  rows: string;
  public token: any;
  public xterm: xterm;

  clearLine = "\u001b[2K\r"

  ngOnInit() {
  	this.initializeTerminal();
    this.initializeWebShell();
    // this.xterm.on('key', (key, ev) => {
    //   this.xterm.write(key);
    // });
  }

  ngOnChanges(changes: {
    [propKey: string]: SimpleChange }) {
    let log: string[] = [];
    for (let propName in changes) {
      let changedProp = changes[propName];
      // reprint prompt
      if (propName == 'prompt' && this.xterm != null) {
        this.xterm.write(this.clearLine + this.prompt)
      }
    }
  }

  initializeTerminal() {
    this.xterm = new Terminal({
      'cursorBlink': true,
      'tabStopWidth': 4,
      'cols': 80,
      'rows': 50,
      'focus': true
    });
    this.xterm.open(this.container.nativeElement);
    this.xterm.writeln('Welcome to Xin-xterm.js');

    // start registering the event listener, only need to be done the first time
    this.writePrompt();
    let self = this;
    // raw data
    this.xterm.on('data', function(data){
      self.writeBuffer(data)
    });
  }

  // writes the command prompt, a prompt is not part of the input buffer
  writePrompt() {
    this.xterm.write(this.prompt);
  }

  // this writes the raw buffer and includes invisible charaters
  writeBuffer(data) {
    this.xterm.write(data);
    this.buffer += data;
  }

  // reset the command buffer
  resetBuffer() {
    this.buffer = '';
  }

  // stores a command in commmand history
  storeInHistory(cmd) {
    // remove cariage returns from history commands
    cmd = cmd.replace(/\r/,'');
    this.history.push(cmd);
    this.historyIndex = this.history.length;
  }

  initializeWebShell() {
    this.ws.call('auth.generate_token').subscribe((res) => {
      this.ss.token = res;
      this.ss.connect();
    });
  }

  // resets the terminal
  clear() {
    this.xterm.reset();
    this.writePrompt();
  }


  constructor(private ws: WebSocketService, public ss: ShellService) {}
}
