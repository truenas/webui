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
import 'xterm/dist/addons/attach/attach.js';

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  providers: [ShellService],
})

export class ShellComponent implements OnInit, OnChanges {
  // sets the shell prompt
  @Input() prompt: string = '';
  //xter container
  @ViewChild('terminal') container: ElementRef;


  // xterm variables
  cols: string;
  rows: string;
  public token: any;
  public xterm: any;
  private shellSubscription: any;

  clearLine = "\u001b[2K\r"

  ngOnInit() {
    this.getAuthToken().subscribe((res) => {
      this.initializeWebShell(res);
      this.shellSubscription = this.ss.shellOutput.subscribe((value) => {
        this.xterm.write(value);
      });
      this.initializeTerminal();
    });
  }

  ngOnDestroy() {
    this.shellSubscription.unsubscribe();
  };

  ngOnChanges(changes: {
    [propKey: string]: SimpleChange
  }) {
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
    this.xterm.attach(this.ss);
    this.xterm._initialized = true;
  }

  initializeWebShell(res: string) {
    this.ss.token = res;
    this.ss.connect();
  }

  getAuthToken() {
    return this.ws.call('auth.generate_token');
  }

  constructor(private ws: WebSocketService, public ss: ShellService) {}
}
