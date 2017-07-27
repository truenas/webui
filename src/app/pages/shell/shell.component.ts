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
  @Input() prompt: string;

  constructor(private ws: WebSocketService, public ss: ShellService) {

  }
  @ViewChild('terminal') container: ElementRef;
  public xterm: xterm;
  public token: any;

  clearLine = "\u001b[2K\r"

  ngOnInit() {
    this.xterm = new Terminal({
      'cursorBlink': true,
      'tabStopWidth': 4,
      'cols': 80,
      'rows': 50,
      'focus': true
    });

    this.xterm.open(this.container.nativeElement);
    this.xterm.writeln('Welcome to Xin-xterm.js');
    var protocol = (location.protocol === 'https:') ? 'wss://' : 'ws://';
    this.generateToken();
    this.xterm.on('key', (key, ev) => {
      this.xterm.write(key);
    });
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

  generateToken() {
    this.ws.call('auth.generate_token').subscribe((res) => {
      this.ss.token = res;
      this.ss.connect();
    });
  }
}
