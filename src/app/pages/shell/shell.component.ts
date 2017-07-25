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

  ngOnInit() {
    this.xterm = new Terminal();
    this.xterm.open(this.container.nativeElement);
    // this.xterm.fit();
    this.xterm.writeln('Welcome to Xin-xterm.js');
    this.xterm.writeln('This is a local terminal emulation, without a real terminal in the back-end.');
    this.xterm.writeln('Type some keys and commands to play around.');

    this.xterm.on('key', (key, ev) => {
      this.xterm.write(key);
    });
  }
}
