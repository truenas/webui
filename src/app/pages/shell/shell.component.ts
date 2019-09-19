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
    cols: number;
    rows: number;
    rowCount: number;
    font_size = 14;
    public token: any;
    public xterm: any;
    public resize_terminal = true;
    private shellSubscription: any;
    public lastWidth: number;
    public lastHeight: number;

    public usage_tooltip = helptext.usage_tooltip;

    clearLine = "\u001b[2K\r";
    public shellConnected: boolean = false;

    ngAfterViewInit() {
      this.getAuthToken().subscribe((res) => {
        this.initializeWebShell(res);
        this.shellSubscription = this.ss.shellOutput.subscribe((value) => {
          if (value !== undefined && !value.startsWith('stty rows')) {
            this.xterm.write(value);
          } 
        });
        this.initializeTerminal();
        console.log(this.xterm);
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
      this.setTermDimensions();
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
    }){
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
      this.setTermDimensions();
      this.xterm = new (<any>window).Terminal({
        'cursorBlink': true,
        'tabStopWidth': 8,
        'focus': true,
        'cols': this.cols,
        'rows': this.rows
      });
      this.xterm.open(this.container.nativeElement, true);
      this.xterm.attach(this.ss);
      this.xterm._initialized = true;
      this.fitTerm();
      this.rowCount = this.getRowCount(); 
      this.xterm.on('key',(key, e) =>{
        //console.log(e);

        if(e.key == "Enter"){
          this.resetScrollBottom();
          //console.log(e);
      }

    });
  }

  getRowCount(){
    const rows = document.querySelectorAll('.terminal .xterm-rows > div'); 
    return rows.length;
  }

  resetScrollBottom(){
    this.xterm.parser._terminal.buffer.scrollBottom = this.getRowCount() - 2;
    this.xterm.write(this.prompt);
  }

  getTermDimensions(){
    const target:HTMLElement = document.querySelector('.terminal .xterm-viewport'); 
    return {width: target.offsetWidth, height: target.offsetHeight};
  }

  getTermParentDimensions(){
    const target:HTMLElement = document.querySelector('#terminal'); 
    return {width: target.offsetWidth, height: target.offsetHeight};
  }

  setTermDimensions(c?: number, r?: number){
    if(!c || !r){
      let dimensions = this.getTermParentDimensions();
      const cols = Math.floor(dimensions.width / (this.font_size / 2));
      const rows = Math.floor((dimensions.height / this.font_size) - 4);
      this.cols = cols;
      this.rows = rows;
    } else {
      this.cols = c;
      this.rows = r;
    }

    if(this.xterm){
      this.xterm.resize(this.cols, this.rows);
    }
  }

  fitTerm(){
    const dimensions = this.getTermParentDimensions();
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
