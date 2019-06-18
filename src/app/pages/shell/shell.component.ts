import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChange, ViewChild } from "@angular/core";
import { MatSnackBar } from "@angular/material";
import { TranslateService } from "@ngx-translate/core";
import { ShellService, WebSocketService } from "../../services/";
import { T } from "../../translate-marker";


@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.css'],
  providers: [ShellService],
})

export class ShellComponent implements OnInit, OnChanges, OnDestroy {
  // sets the shell prompt
  @Input() prompt = '';
  //xter container
  @ViewChild('terminal') container: ElementRef;
  // xterm variables
  cols: string;
  rows: string;
  font_size: number;
  public token: any;
  public xterm: any;
  public resize_terminal = true;
  public copyText = T("Copy");
  public pasteText = T("Paste");
  private shellSubscription: any;
  private selectedText: string;

  public shell_tooltip = T('<b>Ctrl+C</b> kills a foreground process.<br>\
                            Many utilities are built-in:<br> <b>Iperf</b>,\
                            <b>Netperf</b>, <b>IOzone</b>, <b>arcsat</b>,\
                            <b>tw_cli</b>, <br><b>MegaCli</b>,\
                            <b>freenas-debug</b>, <b>tmux</b>,\
                            <b>Dmidecode</b>.<br> Refer to the <a\
                            href="%%docurl%%/cli.html"\
                            target="_blank">Command Line Utilities</a>\
                            chapter in the guide for usage information\
                            and examples.');

  clearLine = "\u001b[2K\r"
  public shellConnected: boolean = false;

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
    if (this.ss.connected){
      this.ss.socket.close();
    }
    if(this.shellSubscription){
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
    [propKey: string]: SimpleChange
  }) {
    const log: string[] = [];
    for (const propName in changes) {
      const changedProp = changes[propName];
      // reprint prompt
      if (propName === 'prompt' && this.xterm != null) {
        this.xterm.write(this.clearLine + this.prompt)
      }
    }
  }

  onRightClick(): void {
    this._snackbar.open(
      T(
        'Context menu copy and pasting operations \
        are disabled in the Shell. If the expected \
        keyboard shortcuts are not working, try \
        Ctrl + Insert to copy or Shift + Insert to \
        paste.'
      ),
      T('Dismiss')
    )
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
      'cursorBlink': false,
      'tabStopWidth': 8,
      // 'cols': parseInt(colNum.toFixed(),10),
      // 'rows': parseInt(rowNum.toFixed(),10),
      'focus': true
    });
    this.xterm.open(this.container.nativeElement, true);
    this.xterm.attach(this.ss);
    this.xterm.attachCustomKeyEventHandler(event => {
      // Ctrl + Shift + C
      if (event.ctrlKey && event.shiftKey && (event.keyCode == 3)) {
        var copySucceeded = document.execCommand('copy');
        console.log('copy succeeded', copySucceeded);
        return false;
      }
    });
    this.xterm._initialized = true;
  }

  resizeTerm(){
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
    this.xterm.resize(colNum,rowNum);
    return true;
  }

  initializeWebShell(res: string) {
    this.ss.token = res;
    this.ss.connect();

    this.ss.shellConnected.subscribe((res)=> {
      this.shellConnected = res;
    })
  }

  getAuthToken() {
    return this.ws.call('auth.generate_token');
  }

  reconnect() {
    this.ss.connect();
  }

  constructor(private ws: WebSocketService, public ss: ShellService, public translate: TranslateService, private _snackbar: MatSnackBar) {
  }
}
