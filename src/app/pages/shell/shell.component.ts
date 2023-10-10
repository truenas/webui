import {
  Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChange, ViewChild,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { ShellService, WebSocketService } from '../../services';
import helptext from '../../helptext/shell/shell';
import { CopyPasteMessageComponent } from './copy-paste-message.component';

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.css'],
  providers: [ShellService],
})
export class ShellComponent implements OnInit, OnChanges, OnDestroy {
  // sets the shell prompt
  @Input() prompt = '';
  // xter container
  @ViewChild('terminal', { static: true }) container: ElementRef;
  // xterm variables
  cols: string;
  rows: string;
  font_size = 14;
  token: any;
  xterm: any;
  resize_terminal = true;
  private shellSubscription: any;

  usage_tooltip = helptext.usage_tooltip;

  clearLine = '\u001b[2K\r';
  shellConnected = false;

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
    if (this.ss.connected) {
      this.ss.socket.close();
    }
    if (this.shellSubscription) {
      this.shellSubscription.unsubscribe();
    }
  }

  onResize(event) {
    // this.resizeTerm();
  }

  resetDefault() {
    this.font_size = 14;
  }

  ngOnChanges(changes: {
    [propKey: string]: SimpleChange;
  }) {
    const log: string[] = [];
    for (const propName in changes) {
      const changedProp = changes[propName];
      // reprint prompt
      if (propName === 'prompt' && this.xterm != null) {
        this.xterm.write(this.clearLine + this.prompt);
      }
    }
  }

  onRightClick(): false {
    this.dialog.open(CopyPasteMessageComponent);
    return false;
  }

  initializeTerminal() {
    const domHeight = document.body.offsetHeight;
    const domWidth = document.body.offsetWidth;
    let colNum = (domWidth * 0.75 - 104) / 10;
    if (colNum < 80) {
      colNum = 80;
    }
    let rowNum = (domHeight * 0.75 - 104) / 21;
    if (rowNum < 10) {
      rowNum = 10;
    }

    this.xterm = new (<any>window).Terminal({
      cursorBlink: false,
      tabStopWidth: 8,
      // 'cols': parseInt(colNum.toFixed(),10),
      // 'rows': parseInt(rowNum.toFixed(),10),
      focus: true,
    });
    this.xterm.open(this.container.nativeElement, true);
    this.xterm.attach(this.ss);
    this.xterm._initialized = true;
  }

  resizeTerm() {
    const domHeight = document.body.offsetHeight;
    const domWidth = document.body.offsetWidth;
    let colNum = (domWidth * 0.75 - 104) / 10;
    if (colNum < 80) {
      colNum = 80;
    }
    let rowNum = (domHeight * 0.75 - 104) / 21;
    if (rowNum < 10) {
      rowNum = 10;
    }
    this.xterm.resize(colNum, rowNum);
    return true;
  }

  initializeWebShell(res: string) {
    this.ss.token = res;
    this.ss.connect();

    this.ss.shellConnected.subscribe((res) => {
      this.shellConnected = res;
    });
  }

  getAuthToken() {
    return this.ws.call('auth.generate_token');
  }

  reconnect() {
    this.ss.connect();
  }

  constructor(private ws: WebSocketService, public ss: ShellService, public translate: TranslateService, private dialog: MatDialog) {
  }
}
