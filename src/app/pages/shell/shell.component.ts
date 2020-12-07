import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChange, ViewChild } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { MatDialog } from '@angular/material/dialog';
import { ShellService, WebSocketService } from "../../services/";
import helptext from "./../../helptext/shell/shell";
import { CopyPasteMessageComponent } from "./copy-paste-message.component";

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
  @ViewChild('terminal', { static: true}) container: ElementRef;
  // xterm variables
  cols: string;
  rows: string;
  font_size = 14;
  public token: any;
  public xterm: any;
  public resize_terminal = true;
  private shellSubscription: any;

  public usage_tooltip = helptext.usage_tooltip;

  clearLine = "\u001b[2K\r"
  public shellConnected: boolean = false;
  public connectionId: string;

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
    this.resizeTerm();
  }

  onFontSizeChanged(event) {
    this.resizeTerm();
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

  onRightClick(): false {
    this.dialog.open(CopyPasteMessageComponent);
    return false;
  }

  initializeTerminal() {
    
    const size = this.getSize();

    const setting = {
      'cursorBlink': false,
      'tabStopWidth': 8,
      'cols': size.cols,
      'rows': size.rows,
      'focus': true
    };

    this.xterm = new (<any>window).Terminal(setting);
    this.xterm.open(this.container.nativeElement, true);
    this.xterm.attach(this.ss);
    this.xterm._initialized = true;
  }

  getSize() {
    const domWidth = this.container.nativeElement.offsetWidth;
    const domHeight = this.container.nativeElement.offsetHeight;
    var span = document.createElement('span');
    this.container.nativeElement.appendChild(span);
    span.className = "terminal xterm";
    span.style.whiteSpace = 'nowrap';
    span.style.fontSize = this.font_size + 'px';

    let cols = 0;
    
    while(span.offsetWidth < domWidth) {
      span.innerHTML += 'a';
      cols++;
    }

    let rows = Math.ceil(domHeight / span.offsetHeight);
    span.remove();
    if (cols < 80) {
      cols = 80;
    }
    
    if (rows < 10) {
      rows = 10;
    }

    return {
      rows: rows,
      cols: cols
    }
  }

  resizeTerm(){
    const size = this.getSize();
    console.log(size);
    this.xterm.fit();
    // this.xterm.resize(size.cols, size.rows);
    this.ws.call('core.resize_shell', [this.connectionId, size.cols, size.rows]).subscribe((res)=> {
    });
    return true;
  }

  initializeWebShell(res: string) {
    this.ss.token = res;
    this.ss.connect();

    this.ss.shellConnected.subscribe((res)=> {
      this.shellConnected = res.connected;
      this.connectionId = res.id;
      this.resizeTerm();
    })
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
