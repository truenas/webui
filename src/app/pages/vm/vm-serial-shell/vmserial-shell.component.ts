import {
  Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChange, SimpleChanges, ViewChild, ViewEncapsulation,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { CopyPasteMessageComponent } from 'app/pages/shell/copy-paste-message.component';
import { Observable } from 'rxjs';
import helptext from '../../../helptext/vm/vm-cards/vm-cards';
import { ShellConnectedEvent } from '../../../interfaces/shell.interface';
import { ShellService, WebSocketService } from '../../../services';
import { Terminal } from 'xterm';
import { AttachAddon } from 'xterm-addon-attach';
import { FitAddon } from 'xterm-addon-fit';
import * as FontFaceObserver from 'fontfaceobserver';

@Component({
  selector: 'app-vmserial-shell',
  templateUrl: './vmserial-shell.component.html',
  styleUrls: ['./vmserial-shell.component.scss'],
  providers: [ShellService],
  encapsulation: ViewEncapsulation.None,
})

export class VMSerialShellComponent implements OnInit, OnDestroy {
  @Input() prompt = '';
  @ViewChild('terminal', { static: true }) container: ElementRef;
  cols: string;
  rows: string;
  font_size = 14;
  font_name = 'Inconsolata';
  connectionId: string;
  token: any;
  xterm: any;
  private shellSubscription: any;
  shell_tooltip = helptext.serial_shell_tooltip;
  private fitAddon: any;

  clearLine = '\u001b[2K\r';
  protected pk: string;

  constructor(private ws: WebSocketService,
    public ss: ShellService,
    protected aroute: ActivatedRoute,
    public translate: TranslateService,
    private dialog: MatDialog) {
  }

  ngOnInit(): void {
    this.aroute.params.subscribe((params) => {
      this.pk = params['pk'];
      this.getAuthToken().subscribe((token) => {
        this.initializeWebShell(token);
        this.shellSubscription = this.ss.shellOutput.subscribe((value: any) => {
          if (value !== undefined) {
            // this.xterm.write(value);
          }
        });
        this.initializeTerminal();
      });
    });
  }

  ngOnDestroy(): void {
    if (this.shellSubscription) {
      this.shellSubscription.unsubscribe();
    }
    if (this.ss.connected) {
      this.ss.socket.close();
    }
  }

  onResize(): void {
    this.resizeTerm();
  }

  onFontSizeChanged(): void {
    this.resizeTerm();
  }

  resetDefault(): void {
    this.font_size = 14;
    this.resizeTerm();
  }

  getSize(): { rows: number; cols: number } {
    const domWidth = this.container.nativeElement.offsetWidth;
    const domHeight = this.container.nativeElement.offsetHeight;
    var span = document.createElement('span');
    this.container.nativeElement.appendChild(span);
    span.style.whiteSpace = 'nowrap';
    span.style.fontFamily = this.font_name;
    span.style.fontSize = this.font_size + 'px';
    span.innerHTML = 'a';

    let cols = 0;
    while (span.offsetWidth < domWidth) {
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
      rows,
      cols,
    };
  }

  initializeTerminal(): void {
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

    font.load().then(() => {
      this.xterm.open(this.container.nativeElement);
      this.fitAddon.fit();
      this.xterm._initialized = true;
    }, (e) => {
      console.log('Font is not available', e);
    });
  }

  resizeTerm(): boolean {
    const size = this.getSize();
    this.xterm.setOption('fontSize', this.font_size);
    this.fitAddon.fit();
    this.ws.call('core.resize_shell', [this.connectionId, size.cols, size.rows]).subscribe(() => {
      this.xterm.focus();
    });
    return true;
  }

  initializeWebShell(token: string): void {
    this.ss.vmId = Number(this.pk);
    this.ss.token = token;
    this.ss.connect();

    this.ss.shellConnected.subscribe((res: ShellConnectedEvent) => {
      this.connectionId = res.id;
      this.resizeTerm();
    });
  }

  getAuthToken(): Observable<string> {
    return this.ws.call('auth.generate_token');
  }

  onRightClick(): false {
    this.dialog.open(CopyPasteMessageComponent);
    return false;
  }
}
