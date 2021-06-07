import {
  Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as FontFaceObserver from 'fontfaceobserver';
import { Subject, Observable } from 'rxjs';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { XtermAttachAddon } from 'app/core/classes/xterm-attach-addon';
import { CoreService } from 'app/core/services/core.service';
import helptext from 'app/helptext/shell/shell';
import { CoreEvent } from 'app/interfaces/events';
import { ShellConnectedEvent } from 'app/interfaces/shell.interface';
import { EntityToolbarComponent } from 'app/pages/common/entity/entity-toolbar/entity-toolbar.component';
import { ShellService, WebSocketService } from 'app/services';
import { CopyPasteMessageComponent } from './copy-paste-message.component';

@UntilDestroy()
@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
  providers: [ShellService],
  encapsulation: ViewEncapsulation.None,
})
export class ShellComponent implements OnInit, OnDestroy {
  // sets the shell prompt
  @Input() prompt = '';
  // xter container
  @ViewChild('terminal', { static: true }) container: ElementRef;
  // xterm variables
  cols: string;
  rows: string;
  font_size = 14;
  font_name = 'Inconsolata';
  token: any;
  xterm: any;
  resize_terminal = true;
  private shellSubscription: any;
  private shellConnectedSubscription: any;
  private fitAddon: any;
  formEvents: Subject<CoreEvent>;

  usage_tooltip = helptext.usage_tooltip;

  clearLine = '\u001b[2K\r';
  shellConnected = false;
  connectionId: string;

  ngOnInit(): void {
    this.getAuthToken().pipe(untilDestroyed(this)).subscribe((token) => {
      this.initializeWebShell(token);
      this.shellSubscription = this.ss.shellOutput.pipe(untilDestroyed(this)).subscribe(() => {
      });
      this.initializeTerminal();
    });
  }

  ngOnDestroy(): void {
    if (this.ss.connected) {
      this.ss.socket.close();
    }
    if (this.shellSubscription) {
      this.shellSubscription.unsubscribe();
    }

    if (this.shellConnectedSubscription) {
      this.shellConnectedSubscription.unsubscribe();
    }

    this.core.unregister({ observerClass: this });
  }

  refreshToolbarButtons(): void {
    this.formEvents = new Subject();
    this.formEvents.pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      if (evt.data.event_control == 'restore') {
        this.resetDefault();
        this.refreshToolbarButtons();
      } else if (evt.data.event_control == 'reconnect') {
        this.reconnect();
        this.refreshToolbarButtons();
      } else if (evt.data.event_control == 'fontsize') {
        this.font_size = evt.data.fontsize;
        this.resizeTerm();
      }
    });

    let controls = [];
    if (this.shellConnected) {
      controls = [
        {
          name: 'fontsize',
          label: 'Set font size',
          type: 'slider',
          min: 10,
          max: 20,
          step: 1,
          value: this.font_size,
        },
        {
          name: 'restore',
          label: 'Restore default',
          type: 'button',
          color: 'primary',
          placeholder: 'Shell Commands',
          tooltip: `<b>Copy & Paste</b> <br/>
                    Context menu copy and paste operations are disabled in the Shell. Copy and paste shortcuts for Mac are <i>Command+C</i> and <i>Command+V</i>. For most operating systems, use <i>Ctrl+Insert</i> to copy and <i>Shift+Insert</i> to paste.<br/><br/>
                    <b>Kill Process</b> <br/>
                    Kill process shortcut is <i>Crtl+C</i>.`,
        },
      ];
    } else {
      controls = [
        {
          name: 'reconnect',
          label: 'Reconnect',
          type: 'button',
          color: 'primary',
        },
      ];
    }
    // Setup Global Actions
    const actionsConfig = {
      actionType: EntityToolbarComponent,
      actionConfig: {
        target: this.formEvents,
        controls,
      },
    };

    this.core.emit({ name: 'GlobalActions', data: actionsConfig, sender: this });
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

  onRightClick(): false {
    this.dialog.open(CopyPasteMessageComponent);
    return false;
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
      allowTransparency: true,
    };

    this.xterm = new Terminal(setting);

    this.fitAddon = new FitAddon();
    this.xterm.loadAddon(this.fitAddon);

    var font = new FontFaceObserver(this.font_name);

    font.load().then(() => {
      this.xterm.open(this.container.nativeElement);
      this.fitAddon.fit();
      this.xterm._initialized = true;
    }, (e) => {
      console.error('Font is not available', e);
    });
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

  resizeTerm(): boolean {
    const size = this.getSize();
    this.xterm.setOption('fontSize', this.font_size);
    this.fitAddon.fit();
    this.ws.call('core.resize_shell', [this.connectionId, size.cols, size.rows]).pipe(untilDestroyed(this)).subscribe(() => {
      this.xterm.focus();
    });
    return true;
  }

  initializeWebShell(token: string): void {
    this.ss.token = token;
    this.ss.connect();

    this.refreshToolbarButtons();

    this.shellConnectedSubscription = this.ss.shellConnected.pipe(untilDestroyed(this)).subscribe((event: ShellConnectedEvent) => {
      this.shellConnected = event.connected;
      this.connectionId = event.id;

      const attachAddon = new XtermAttachAddon(this.ss.socket);
      this.xterm.loadAddon(attachAddon);

      this.refreshToolbarButtons();
      this.resizeTerm();
    });
  }

  getAuthToken(): Observable<string> {
    return this.ws.call('auth.generate_token');
  }

  reconnect(): void {
    this.ss.connect();
  }

  constructor(
    private core: CoreService,
    private ws: WebSocketService,
    private ss: ShellService,
    private translate: TranslateService,
    private dialog: MatDialog,
  ) {}
}
