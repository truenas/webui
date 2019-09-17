import { Component, ElementRef, Input, OnChanges, OnDestroy, AfterViewInit, SimpleChange, ViewChild } from "@angular/core";
import { MatSnackBar } from "@angular/material";
import { TranslateService } from "@ngx-translate/core";
import { ShellService, WebSocketService } from "../../services/";
import helptext from "./../../helptext/shell/shell";
import { CopyPasteMessageComponent } from "./copy-paste-message.component";

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.css'],
  providers: [ShellService],
})
export class ShellComponent implements AfterViewInit, OnChanges, OnDestroy {
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

  ngAfterViewInit() {
    this.getAuthToken().subscribe((res) => {
      this.initializeWebShell(res);
      this.shellSubscription = this.ss.shellOutput.subscribe((value) => {
        if (value !== undefined) {
          this.xterm.write(value);
        }
      });
      this.initializeTerminal();
    });
    this.overflowParent('hidden');
  }

  ngOnDestroy() {
    if (this.ss.connected){
      this.ss.socket.close();
    }
    if(this.shellSubscription){
      this.shellSubscription.unsubscribe();
    }
    this.overflowParent('auto');
  }

  onResize(event) {
    this.fitTerm();
  }

  overflowParent(rule: string){
    let target:HTMLElement = document.querySelector('.rightside-content-hold');
    target.style['overflow-y'] = rule;
  }

  resetDefault() {
    this.font_size = 14;
  }

  ngOnChanges(changes: {
    [propKey: string]: SimpleChange
  }) {
    //this.fitTerm();
    //this.xterm.fit();
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
    this._snackbar.openFromComponent(CopyPasteMessageComponent);

    return false;
  }

  initializeTerminal() {
    this.xterm = new (<any>window).Terminal({
      'cursorBlink': true,
      'tabStopWidth': 8,
      'focus': true
    });
    this.xterm.open(this.container.nativeElement, true);
    this.xterm.attach(this.ss);
    this.xterm._initialized = true;
    this.fitTerm();
  }

  getTermDimensions(){
    const target:HTMLElement = document.querySelector('#terminal'); 
    return {width: target.offsetWidth, height: target.offsetHeight};
  }

  fitTerm(){
    const dimensions = this.getTermDimensions();
    const vp:HTMLElement = document.querySelector('.terminal .xterm-viewport'); 
    const sel:HTMLElement = document.querySelector('.terminal .xterm-selection'); 

    this.xterm.fit();
    sel.style.height = dimensions.height.toString() + 'px';
    vp.style.height = dimensions.height.toString() + 'px';
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
