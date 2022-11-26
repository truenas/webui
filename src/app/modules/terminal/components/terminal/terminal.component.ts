import {
  AfterViewInit,
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, ElementRef, Input, OnDestroy, OnInit, TemplateRef, ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import * as FontFaceObserver from 'fontfaceobserver';
import { filter } from 'rxjs/operators';
import { ITerminalInitOnlyOptions, ITerminalOptions, Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { ShellConnectedEvent } from 'app/interfaces/shell.interface';
import { TerminalConfiguration } from 'app/interfaces/terminal.interface';
import { CopyPasteMessageComponent } from 'app/modules/terminal/components/copy-paste-message/copy-paste-message.component';
import { Utf8ToUtf32 } from 'app/modules/terminal/components/terminal/decoder';
import { XtermAttachAddon } from 'app/modules/terminal/xterm-attach-addon';
import { ShellService, WebSocketService } from 'app/services';
import { CoreService } from 'app/services/core-service/core.service';
import { LayoutService } from 'app/services/layout.service';
import { AppState } from 'app/store';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-terminal',
  templateUrl: './terminal.component.html',
  styleUrls: ['./terminal.component.scss'],
  providers: [ShellService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TerminalComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() conf: TerminalConfiguration;
  @ViewChild('terminal', { static: true }) container: ElementRef;
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;

  waitParentChanges = 300;
  fontSize = 14;
  fontName = 'Inconsolata';
  defaultFontName = 'monospace';
  xterm: Terminal;
  shellConnected = false;
  connectionId: string;
  terminalSettings: ITerminalOptions & ITerminalInitOnlyOptions = {
    cursorBlink: false,
    tabStopWidth: 8,
    cols: 80,
    rows: 20,
    fontSize: this.fontSize,
    fontFamily: this.defaultFontName,
    allowTransparency: true,
  };

  private fitAddon: FitAddon;
  private attachAddon: XtermAttachAddon;

  readonly toolbarTooltip = this.translate.instant(`<b>Copy & Paste</b> <br/>
                  Context menu copy and paste operations are disabled in the Shell. Copy and paste shortcuts for Mac are <i>Command+C</i> and <i>Command+V</i>. For most operating systems, use <i>Ctrl+Insert</i> to copy and <i>Shift+Insert</i> to paste.<br/><br/>
                  <b>Kill Process</b> <br/>
                  Kill process shortcut is <i>Crtl+C</i>.`);

  constructor(
    private ws: WebSocketService,
    private shellService: ShellService,
    private dialog: MatDialog,
    private translate: TranslateService,
    private layoutService: LayoutService,
    private store$: Store<AppState>,
    private cdr: ChangeDetectorRef,
    public core: CoreService,
  ) {}

  ngOnInit(): void {
    if (this.conf.preInit) {
      this.conf.preInit().pipe(untilDestroyed(this)).subscribe(() => {
        this.initShell();
      });
    } else {
      this.initShell();
    }

    if (this.conf.reconnectShell$) {
      this.conf.reconnectShell$.pipe(untilDestroyed(this)).subscribe(() => {
        this.reconnect();
      });
    }

    this.store$.pipe(
      waitForPreferences,
      filter((preferences) => Boolean(preferences.sidenavStatus)),
      untilDestroyed(this),
    ).subscribe(() => {
      if (this.shellConnected) {
        setTimeout(() => { this.resizeTerm(); }, this.waitParentChanges);
      }
    });

    this.core.register({
      observerClass: this,
      eventName: 'MediaChange',
    }).pipe(untilDestroyed(this)).subscribe(() => {
      if (this.shellConnected) {
        setTimeout(() => { this.resizeTerm(); }, this.waitParentChanges);
      }
    });
  }

  initShell(): void {
    this.ws.call('auth.generate_token').pipe(untilDestroyed(this)).subscribe((token) => {
      this.initializeWebShell(token);
      this.shellService.shellOutput.pipe(untilDestroyed(this)).subscribe(() => {});
      this.initializeTerminal();
    });
  }

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
  }

  ngOnDestroy(): void {
    if (this.shellService.connected) {
      this.shellService.socket.close();
    }
  }

  private sendBinary(data: string): void {
    const buffer = new Uint8Array(data.length);
    for (let i = 0; i < data.length; ++i) {
      buffer[i] = data.charCodeAt(i) & 255;
    }

    this.shellService.socket.send(buffer);
  }

  onTest0(): void {
    this.sendBinary('clear\necho "If you can read this, then test 0 worked"\n');
  }

  onTest1(): void {
    this.xterm.writeln('If you can read this, then test 1 worked');
  }

  onTest2(): void {
    // eslint-disable-next-line max-len
    this.xterm.writeln(new Uint8Array([73, 102, 32, 121, 111, 117, 32, 99, 97, 110, 32, 114, 101, 97, 100, 32, 116, 104, 105, 115, 44, 32, 116, 104, 101, 110, 32, 116, 101, 115, 116, 32, 50, 32, 119, 111, 114, 107, 101, 100]));
  }

  onTest3(): void {
    const linux = new Uint8Array([76, 105, 110, 117, 120]);
    const decoder = new Utf8ToUtf32();
    const result = new Uint32Array({ length: linux.length * 4 });
    const n = decoder.decode(linux, result);
    // eslint-disable-next-line no-console
    console.log('Test 3 (see console)', n, result);
  }

  onResize(): void {
    this.resizeTerm();
  }

  onRightClick(): false {
    this.dialog.open(CopyPasteMessageComponent);
    return false;
  }

  initializeTerminal(): void {
    this.xterm = new Terminal(this.terminalSettings);

    this.fitAddon = new FitAddon();
    this.xterm.loadAddon(this.fitAddon);

    const font = new FontFaceObserver(this.fontName);

    font.load().then(() => {
      this.xterm.options.fontFamily = this.fontName;
      this.drawTerminal();
    }, (error) => {
      this.drawTerminal();
      console.error('Font is not available', error);
    });
  }

  drawTerminal(): void {
    this.xterm.open(this.container.nativeElement);
    this.fitAddon.fit();
  }

  updateTerminal(): void {
    if (this.shellConnected) {
      this.xterm.clear();
    }

    if (this.attachAddon) {
      this.attachAddon.dispose();
    }

    this.attachAddon = new XtermAttachAddon(this.shellService.socket);
    this.xterm.loadAddon(this.attachAddon);
  }

  resizeTerm(): boolean {
    this.xterm.options.fontSize = this.fontSize;
    this.fitAddon.fit();
    const size = this.fitAddon.proposeDimensions();
    if (size) {
      this.ws.call('core.resize_shell', [this.connectionId, size.cols, size.rows]).pipe(untilDestroyed(this)).subscribe(() => {
        this.xterm.focus();
      });
    }
    this.cdr.detectChanges();
    return true;
  }

  initializeWebShell(token: string): void {
    this.shellService.token = token;

    if (this.conf.setShellConnectionData) {
      this.conf.setShellConnectionData(this.shellService);
    }
    this.shellService.connect();

    this.shellService.shellConnected.pipe(untilDestroyed(this)).subscribe((event: ShellConnectedEvent) => {
      this.shellConnected = event.connected;
      this.connectionId = event.id;
      this.updateTerminal();
      this.resizeTerm();
    });
  }

  resetDefault(): void {
    this.fontSize = 14;
    this.resizeTerm();
  }

  reconnect(): void {
    if (this.conf.setShellConnectionData) {
      this.conf.setShellConnectionData(this.shellService);
    }
    this.shellService.connect();
  }

  onFontSizeChanged(newSize: number): void {
    this.fontSize = newSize;
    this.resizeTerm();
  }
}
