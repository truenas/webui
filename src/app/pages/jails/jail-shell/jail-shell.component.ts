import {
  Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChange, SimpleChanges, ViewChild, ViewEncapsulation,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { XtermAttachAddon } from 'app/core/classes/xterm-attach-addon';
import { CopyPasteMessageComponent } from 'app/pages/shell/copy-paste-message.component';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { ShellService, WebSocketService } from '../../../services';
import helptext from '../../../helptext/shell/shell';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import * as FontFaceObserver from 'fontfaceobserver';

@Component({
  selector: 'app-jail-shell',
  templateUrl: './jail-shell.component.html',
  styleUrls: ['./jail-shell.component.scss'],
  providers: [ShellService],
  encapsulation: ViewEncapsulation.None,
})

export class JailShellComponent implements OnInit, OnChanges, OnDestroy {
  // sets the shell prompt
  @Input() prompt = '';
  // xter container
  @ViewChild('terminal', { static: true }) container: ElementRef;
  // xterm variables
  cols: string;
  rows: string;
  font_size = 14;
  font_name = 'Inconsolata';
  connectionId: string;
  token: any;
  xterm: any;
  private shellSubscription: any;
  private fitAddon: any;
  shell_tooltip = helptext.usage_tooltip;

  clearLine = '\u001b[2K\r';
  protected pk: string;
  protected route_success: string[] = ['jails'];
  constructor(private ws: WebSocketService,
    public ss: ShellService,
    protected aroute: ActivatedRoute,
    public translate: TranslateService,
    protected router: Router,
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

            if (_.trim(value) == 'logout') {
              this.xterm.destroy();
              this.router.navigate(new Array('/').concat(this.route_success));
            }
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

  onRightClick(): false {
    this.dialog.open(CopyPasteMessageComponent);
    return false;
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

  ngOnChanges(changes: SimpleChanges): void {
    for (const propName in changes) {
      // reprint prompt
      if (propName === 'prompt' && this.xterm != null) {
        this.xterm.write(this.clearLine + this.prompt);
      }
    }
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
    const attachAddon = new XtermAttachAddon(this.ss.socket);
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
    this.ss.token = token;
    this.ss.jailId = this.pk;
    this.ss.connect();

    this.ss.shellConnected.subscribe((res: any) => {
      this.connectionId = res.id;
      this.resizeTerm();
    });
  }

  getAuthToken(): Observable<string> {
    return this.ws.call('auth.generate_token');
  }

  onShellRightClick(): false {
    this.dialog.open(CopyPasteMessageComponent);
    return false;
  }
}
