import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';

import { RestService, WebSocketService } from '../../services/';
import * as xterm from "xterm";
import * as Terminal from 'xterm/dist/xterm';
import 'xterm/dist/addons/fit/fit.js';

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html'
})

export class ShellComponent implements OnInit {
  constructor(private rest: RestService, private ws: WebSocketService) {}
  @ViewChild('terminal') container: ElementRef;
  public xterm: xterm;
  public token: any;
  public socket: WebSocket;

  ngOnInit() {
    this.xterm = new Terminal({
    	'cursorBlink': true,
    	'tabStopWidth': 4,
    	'cols': 80,
    	'rows': 50
    });
    var protocol = (location.protocol === 'https:') ? 'wss://' : 'ws://';
    var socketURL = protocol + location.hostname + ((location.port) ? (':' + location.port) : '') + "/websocket/shell/";
    this.xterm.open(this.container.nativeElement);
    this.xterm.writeln('Welcome to Xin-xterm.js');
    this.generateToken();
    this.socket = new WebSocket(socketURL);
    this.socket.onopen = this.onOpen;
    this.xterm.on('key', (key, ev) => {
      this.xterm.write(key);
    });
  }

  generateToken() {
  	this.ws.call('auth.generate_token').subscribe((res) => {
  		this.token = res;
  	});
  }

  onOpen() {
	this.socket.send(JSON.stringify({
		token: this.token
	}));
  }
}
