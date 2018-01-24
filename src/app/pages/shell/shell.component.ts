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
import {TooltipComponent} from '../common/entity/entity-form/components/tooltip/tooltip.component';

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.css'],
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
  font_size: number;
  public token: any;
  public xterm: any;
  private shellSubscription: any;

  public shell_tooltip = 'You can use the system copy/paste command. Ctrl + c/v or Command + c/v for mac users.';

  clearLine = "\u001b[2K\r"

  ngOnInit() {
    this.getAuthToken().subscribe((res) => {
      this.initializeWebShell(res);
      this.shellSubscription = this.ss.shellOutput.subscribe((value) => {
        if (value !== undefined) {
          this.xterm.write(value);
        }
      });
      this.initializeTerminal();
    });
  }

  ngOnDestroy() {
    this.shellSubscription.unsubscribe();
  };

  resetDefault() {
    this.font_size = 14;
  }

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
    let domHeight = document.body.offsetHeight;
    let rowNum = (domHeight * 0.75 - 104) / 21;
    if (rowNum < 10) {
      rowNum = 10;
    }

    this.xterm = new Terminal({
      'cursorBlink': true,
      'tabStopWidth': 4,
      'cols': 80,
      'rows': parseInt(rowNum.toFixed()),
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
