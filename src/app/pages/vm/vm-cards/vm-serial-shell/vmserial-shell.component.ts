import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnChanges,
  Input,
  Output,
  EventEmitter,
  SimpleChange,
  OnDestroy
} from '@angular/core';
import { Subscription } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core'
import { Terminal } from 'vscode-xterm';
import * as fit from 'vscode-xterm/lib/addons/fit';
import * as attach from 'vscode-xterm/lib/addons/attach';

import { WebSocketService, ShellService } from '../../../../services/';
import { TooltipComponent } from '../../../common/entity/entity-form/components/tooltip/tooltip.component';

@Component({
  selector: 'app-vmserial-shell',
  templateUrl: './vmserial-shell.component.html',
  styleUrls: ['./vmserial-shell.component.css'],
  providers: [ShellService],
})

export class VMSerialShellComponent implements OnInit, OnChanges, OnDestroy {
  @Input() prompt= '';
  @ViewChild('terminal') container: ElementRef;
  cols: string;
  rows: string;
  font_size: number;
  public token: any;
  public xterm: any;
  private shellSubscription: any;

  public shell_tooltip = 'Copy/paste with <b>Ctrl + C/V</b> or\
 <b>Command + C/V</b>.<br>\
 Many utilities are built-in, including:<br>\
 <b>Iperf</b>, <b>Netperf</b>, <b>IOzone</b>, <b>arcsat</b>,\
 <b>tw_cli</b>, <b>MegaCli</b>,<b>freenas-debug</b>,<b>tmux</b>,\
 and <b>Dmidecode</b>. See the <b>Guide > Command Line Utilities</b>\
 chapter for more information.';

  clearLine = "\u001b[2K\r"
  protected pk: string;

  constructor(private ws: WebSocketService,
              public ss: ShellService,
              protected aroute: ActivatedRoute,
              public translate: TranslateService) {
                Terminal.applyAddon(fit);
                Terminal.applyAddon(attach);
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
    
    this.xterm = new Terminal({
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
