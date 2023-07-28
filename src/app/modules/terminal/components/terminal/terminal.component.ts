import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, ElementRef, HostListener, Input, OnDestroy, OnInit, ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import * as FontFaceObserver from 'fontfaceobserver';
import { filter, take, tap } from 'rxjs/operators';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { ShellConnectedEvent } from 'app/interfaces/shell.interface';
import { TerminalConfiguration } from 'app/interfaces/terminal.interface';
import { CopyPasteMessageComponent } from 'app/modules/terminal/components/copy-paste-message/copy-paste-message.component';
import { XtermAttachAddon } from 'app/modules/terminal/xterm-attach-addon';
import { AuthService } from 'app/services/auth/auth.service';
import { ShellService } from 'app/services/shell.service';
import { WebSocketService } from 'app/services/ws.service';
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
export class TerminalComponent implements OnInit, OnDestroy {
  @Input() conf: TerminalConfiguration;
  @ViewChild('terminal', { static: true }) container: ElementRef;

  waitParentChanges = 300;
  fontSize = 14;
  fontName = 'Inconsolata';
  defaultFontName = 'monospace';
  xterm: Terminal;
  shellConnected = false;
  connectionId: string;
  terminalSettings = {
    cursorBlink: false,
    tabStopWidth: 8,
    cols: 80,
    rows: 20,
    focus: true,
    fontSize: this.fontSize,
    fontFamily: this.defaultFontName,
    allowTransparency: true,
  };

  private fitAddon: FitAddon;
  private attachAddon: XtermAttachAddon;

  readonly toolbarTooltip = this.translate.instant(`<b>Copy & Paste</b> <br/>
                  Context menu copy and paste operations are disabled in the Shell. Copy and paste shortcuts for Mac are <i>Command+C</i> and <i>Command+V</i>. For most operating systems, use <i>Ctrl+Insert</i> to copy and <i>Shift+Insert</i> to paste.<br/><br/>
                  <b>Kill Process</b> <br/>
                  Kill process shortcut is <i>Ctrl+C</i>.`);

  constructor(
    private ws: WebSocketService,
    private shellService: ShellService,
    private dialog: MatDialog,
    private translate: TranslateService,
    private store$: Store<AppState>,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
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
  }

  @HostListener('window:resize')
  onWindowResized(): void {
    if (this.shellConnected) {
      setTimeout(() => { this.resizeTerm(); }, this.waitParentChanges);
    }
  }

  initShell(): void {
    this.authService.authToken$.pipe(
      take(1),
      tap((token) => {
        this.initializeWebShell(token);
        this.shellService.shellOutput.pipe(untilDestroyed(this)).subscribe(() => {});
        this.initializeTerminal();
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  ngOnDestroy(): void {
    if (this.shellService.connected) {
      this.shellService.socket.close();
    }
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
      this.xterm.setOption('fontFamily', this.fontName);
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
    this.xterm.setOption('fontSize', this.fontSize);
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
