import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnChanges,
  Input,
  SimpleChange,
  OnDestroy
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core'
//import { Terminal } from 'vscode-xterm';
//import * as fit from 'vscode-xterm/lib/addons/fit';
//import * as attach from 'vscode-xterm/lib/addons/attach';

import { WebSocketService, ShellService } from '../../../../services/';
import helptext from '../../../../helptext/vm/vm-cards/vm-cards';

@Component({
  selector: 'app-vmserial-shell',
  templateUrl: './vmserial-shell.component.html',
  styleUrls: ['./vmserial-shell.component.css'],
  providers: [ShellService],
})

export class VMSerialShellComponent implements OnInit, OnChanges, OnDestroy {
  @Input() prompt= '';
  @ViewChild('terminal', { static: true}) container: ElementRef;
  cols: string;
  rows: string;
  font_size: number;
  public token: any;
  public xterm: any;
  private shellSubscription: any;

  public shell_tooltip = helptext.serial_shell_tooltip;

  clearLine = "\u001b[2K\r"
  protected pk: string;

  constructor(private ws: WebSocketService,
              public ss: ShellService,
              protected aroute: ActivatedRoute,
              public translate: TranslateService) {
                //Terminal.applyAddon(fit);
                //Terminal.applyAddon(attach);
              }


  ngOnInit() {
    this.aroute.params.subscribe(params => {
      this.pk = params['pk'];
      this.getAuthToken().subscribe((res) => {
        this.initializeWebShell(res);
        this.shellSubscription = this.ss.shellOutput.subscribe((value) => {
          if (value !== undefined) {
            this.xterm.write(value);
          }
        });
        this.initializeTerminal();
      });
    });

  }

  ngOnDestroy() {
    if (this.shellSubscription) {
      this.shellSubscription.unsubscribe();
    }
    if (this.ss.connected){
      this.ss.socket.close();
    }
  };

  resetDefault() {
    this.font_size = 14;
  }

  ngOnChanges(changes: {
    [propKey: string]: SimpleChange
  }) {
    const log: string[] = [];
    for (const propName in changes) {
      const changedProp = changes[propName];
    }
  }

  initializeTerminal() {
    const domHeight = document.body.offsetHeight;
    let rowNum = (domHeight * 0.75 - 104) / 21;
    if (rowNum < 10) {
      rowNum = 10;
    }

    this.xterm = new (<any>window).Terminal({
      'cursorBlink': true,
      'tabStopWidth': 8,
      'cols': 80,
      'rows': parseInt(rowNum.toFixed(),10),
      'focus': true
    });

    this.xterm.open(this.container.nativeElement);
    this.xterm.attach(this.ss);
    this.xterm._initialized = true;
    // this.xterm.send('attachconsole.py /dev/nmdm'+this.pk+'B\n')
    this.xterm.send('cu -l /dev/nmdm'+this.pk+'B\n');
    this.xterm.send('\r');
  }

  initializeWebShell(res: string) {
    this.ss.token = res;
    this.ss.connect();
  }

  getAuthToken() {
    return this.ws.call('auth.generate_token');
  }


}
