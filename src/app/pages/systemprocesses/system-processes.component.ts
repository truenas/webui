import { Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ShellService, WebSocketService } from '../../services/';
import { CopyPasteMessageComponent } from '../shell/copy-paste-message.component';
import { Terminal } from 'xterm';
import { AttachAddon } from 'xterm-addon-attach';
import { FitAddon } from 'xterm-addon-fit';
import * as FontFaceObserver from 'fontfaceobserver';

@Component({
  selector: 'app-system-processes',
  templateUrl: './system-processes.component.html',
  styleUrls: ['./system-processes.component.scss'],
  providers: [ShellService],
  encapsulation: ViewEncapsulation.None,
})

export class SystemProcessesComponent implements OnInit, OnDestroy {

  //xter container
  @ViewChild('terminal', { static: true}) container: ElementRef;

  // xterm variables
  public token: any;
  public xterm: any;
  private shellSubscription: any;
  private top_displayed = false;
  private fitAddon: any;
  public connectionId: string;
  clearLine = "\u001b[2K\r"
  font_size = 14;
  font_name = 'Inconsolata';

  ngOnInit() {
    const self = this;
    this.getAuthToken().subscribe((res) => {
      this.initializeWebShell(res);
      this.shellSubscription = this.ss.shellOutput.subscribe((value) => {
        // this.xterm.write(value);
        if (!this.top_displayed) {
          setTimeout(function() {
            self.xterm.send('top\n');
            setTimeout(function() {
              self.xterm.setOption('disableStdin', true);
            }, 100);
          }, 1000);
          this.top_displayed = true;
        }
      });
      this.initializeTerminal();
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

  getSize() {
    const domWidth = this.container.nativeElement.offsetWidth;
    const domHeight = this.container.nativeElement.offsetHeight;
    var span = document.createElement('span');
    this.container.nativeElement.appendChild(span);
    span.style.whiteSpace = 'nowrap';
    span.style.fontFamily = this.font_name;
    span.style.fontSize = this.font_size + 'px';
    span.innerHTML = 'a';

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

  initializeTerminal() {
    const size = this.getSize();

    const setting = {
      cursorBlink: false,
      tabStopWidth: 8,
      cols: size.cols,
      rows: size.rows,
      focus: true,
      fontSize: this.font_size,
      fontFamily: this.font_name,
    };

    this.xterm = new Terminal(setting);
    const attachAddon = new AttachAddon(this.ss.socket);
    this.xterm.loadAddon(attachAddon);
    this.fitAddon = new FitAddon();
    this.xterm.loadAddon(this.fitAddon);
    
    var font = new FontFaceObserver(this.font_name);
    
    font.load().then((e) => {
      this.xterm.open(this.container.nativeElement);
      this.fitAddon.fit();
      this.xterm._initialized = true;
    }, function (e) {
      console.log('Font is not available', e);
    });    
  }

  resizeTerm(){
    const size = this.getSize();
    this.xterm.setOption('fontSize', this.font_size);
    this.fitAddon.fit();
    this.ws.call('core.resize_shell', [this.connectionId, size.cols, size.rows]).subscribe((res)=> {
    });
    return true;
  }
  
  initializeWebShell(res: string) {
    this.ss.token = res;
    this.ss.connect();

    this.ss.shellConnected.subscribe((res)=> {
      this.connectionId = res.id;
      this.resizeTerm();
    })
  }

  getAuthToken() {
    return this.ws.call('auth.generate_token');
  }

  onRightClick(): false {
    this.dialog.open(CopyPasteMessageComponent);
    return false;
  }

  onResize(event) {
    this.resizeTerm();
  }

  onFontSizeChanged(event) {
    this.resizeTerm();
  }

  resetDefault() {
    this.font_size = 14;
    this.resizeTerm();
  }
  
  constructor(private ws: WebSocketService, public ss: ShellService, private dialog: MatDialog) {
  }
}
