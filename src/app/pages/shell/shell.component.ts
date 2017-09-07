

import {
  Component,
  AfterViewInit,
  ViewChild,
  Input
} from '@angular/core';

import {WebSocketService, ShellService} from '../../services/';
import * as xterm from "xterm";
import * as Terminal from 'xterm/dist/xterm';
import 'xterm/dist/addons/fit/fit.js';
import 'xterm/dist/addons/attach/attach.js';

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  providers: [ShellService],
})

export class ShellComponent implements AfterViewInit {
  // sets the shell prompt
  @Input() prompt = '';


  // xterm variables
  cols: string;
  rows: string;
  public token: any;
  public xterm: any;
  private shellSubscription: any;

  ngAfterViewInit() {

   this.xterm = new Terminal({
      'cursorBlink': true,
      'tabStopWidth': 4,
      'cols': 80,
      'rows': 50,
      'focus': true
    });


    this.xterm.open(document.getElementById("terminal"), true);
    //this.xterm.attach(this.ws);  We need the websocket.  The shellService /websocket/shell redirects
    this.xterm._initialized = true;

  }


  getAuthToken() {
    return this.ws.call('auth.generate_token')
  }

  constructor(private ws: WebSocketService) {}
}
