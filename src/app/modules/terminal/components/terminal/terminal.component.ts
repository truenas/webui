import { NgStyle } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, ElementRef, HostListener, input, OnDestroy, OnInit, Signal, viewChild,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import FontFaceObserver from 'fontfaceobserver';
import { filter, take, tap } from 'rxjs/operators';
import { ShellConnectedEvent } from 'app/interfaces/shell.interface';
import { TerminalConfiguration } from 'app/interfaces/terminal.interface';
import { ToolbarSliderComponent } from 'app/modules/forms/toolbar-slider/toolbar-slider.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { CopyPasteMessageComponent } from 'app/modules/terminal/components/copy-paste-message/copy-paste-message.component';
import { XtermAttachAddon } from 'app/modules/terminal/xterm-attach-addon';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';
import { AuthService } from 'app/services/auth/auth.service';
import { ShellService } from 'app/services/shell.service';
import { ApiService } from 'app/services/websocket/api.service';
import { AppState } from 'app/store';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-terminal',
  templateUrl: './terminal.component.html',
  styleUrls: ['./terminal.component.scss'],
  providers: [ShellService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ToolbarSliderComponent,
    MatButton,
    TestDirective,
    TooltipComponent,
    NgStyle,
    TranslateModule,
    PageHeaderComponent,
  ],
})
export class TerminalComponent implements OnInit, OnDestroy {
  readonly conf = input.required<TerminalConfiguration>();

  private readonly container: Signal<ElementRef<HTMLElement>> = viewChild('terminal', { read: ElementRef });

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
  private token: string;

  readonly toolbarTooltip = this.translate.instant(`<b>Copy & Paste</b> <br/>
                  Context menu copy and paste operations are disabled in the Shell. Copy and paste shortcuts for Mac are <i>Command+C</i> and <i>Command+V</i>. For most operating systems, use <i>Ctrl+Insert</i> to copy and <i>Shift+Insert</i> to paste.<br/><br/>
                  <b>Kill Process</b> <br/>
                  Kill process shortcut is <i>Ctrl+C</i>.`);

  constructor(
    private api: ApiService,
    private shellService: ShellService,
    private matDialog: MatDialog,
    private translate: TranslateService,
    private store$: Store<AppState>,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    if (this.conf().preInit) {
      this.conf().preInit().pipe(untilDestroyed(this)).subscribe(() => {
        this.initShell();
      });
    } else {
      this.initShell();
    }

    if (this.conf().reconnectShell$) {
      this.conf().reconnectShell$.pipe(untilDestroyed(this)).subscribe(() => {
        this.reconnect();
      });
    }

    this.store$.pipe(
      waitForPreferences,
      filter((preferences) => Boolean(preferences.sidenavStatus)),
      untilDestroyed(this),
    ).subscribe(() => {
      if (this.shellConnected) {
        setTimeout(() => {
          this.resizeTerm();
        }, this.waitParentChanges);
      }
    });
  }

  @HostListener('window:resize')
  onWindowResized(): void {
    if (this.shellConnected) {
      setTimeout(() => {
        this.resizeTerm();
      }, this.waitParentChanges);
    }
  }

  initShell(): void {
    this.authService.authToken$.pipe(
      take(1),
      tap((token) => {
        this.token = token;
        this.initializeWebShell();
        this.initializeTerminal();
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.shellService.disconnectIfSessionActive();
  }

  onResize(): void {
    this.resizeTerm();
  }

  onRightClick(): false {
    this.matDialog.open(CopyPasteMessageComponent);
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
    }, (error: unknown) => {
      this.drawTerminal();
      console.error('Font is not available', error);
    });
  }

  drawTerminal(): void {
    this.xterm.open(this.container().nativeElement);
    this.fitAddon.fit();
  }

  updateTerminal(): void {
    if (this.shellConnected) {
      this.xterm.clear();
    }

    if (this.attachAddon) {
      this.attachAddon.dispose();
    }

    this.attachAddon = new XtermAttachAddon(this.shellService);
    this.xterm.loadAddon(this.attachAddon);
  }

  resizeTerm(): boolean {
    this.xterm.options.fontSize = this.fontSize;
    this.fitAddon.fit();
    const size = this.fitAddon.proposeDimensions();
    if (size) {
      this.api.call('core.resize_shell', [this.connectionId, size.cols, size.rows]).pipe(untilDestroyed(this)).subscribe(() => {
        this.xterm.focus();
      });
    }
    this.cdr.detectChanges();
    return true;
  }

  initializeWebShell(): void {
    this.shellService.connect(this.token, this.conf().connectionData);

    this.shellService.shellConnected$.pipe(untilDestroyed(this)).subscribe((event: ShellConnectedEvent) => {
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
    this.shellService.connect(this.token, this.conf().connectionData);
  }

  onFontSizeChanged(newSize: number): void {
    this.fontSize = newSize;
    this.resizeTerm();
  }
}
