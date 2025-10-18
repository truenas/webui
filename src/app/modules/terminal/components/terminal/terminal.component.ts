import { NgStyle, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, input, OnDestroy, OnInit, Signal, signal, viewChild, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import FontFaceObserver from 'fontfaceobserver';
import { filter, take, tap } from 'rxjs/operators';
import { ShellConnectedEvent } from 'app/interfaces/shell.interface';
import { TerminalConfiguration } from 'app/interfaces/terminal.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { TerminalFontSizeComponent } from 'app/modules/terminal/components/font-size/terminal-font-size.component';
import { XtermAttachAddon } from 'app/modules/terminal/xterm-attach-addon';
import { ApiService } from 'app/modules/websocket/api.service';
import { ShellService } from 'app/services/shell.service';
import { AppState } from 'app/store';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-terminal',
  templateUrl: './terminal.component.html',
  styleUrls: ['./terminal.component.scss'],
  providers: [ShellService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButton,
    MatProgressSpinner,
    NgStyle,
    TranslateModule,
    NgTemplateOutlet,
    PageHeaderComponent,
    TerminalFontSizeComponent,
  ],
})
export class TerminalComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private shellService = inject(ShellService);
  private store$ = inject<Store<AppState>>(Store);
  private authService = inject(AuthService);

  readonly conf = input.required<TerminalConfiguration>();

  private readonly container: Signal<ElementRef<HTMLElement>> = viewChild.required('terminal', { read: ElementRef });

  waitParentChanges = 300;
  fontSize = 14;
  fontName = 'Inconsolata';
  defaultFontName = 'monospace';
  xterm: Terminal;
  protected readonly shellConnected = signal(false);
  protected readonly connectionId = signal<string>(undefined);
  protected readonly isReconnecting = signal(false);
  private autoReconnectEnabled = true;
  protected hasAttemptedAutoReconnect = false;
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

  ngOnInit(): void {
    if (this.conf().preInit) {
      this.conf().preInit?.().pipe(untilDestroyed(this)).subscribe(() => {
        this.initShell();
      });
    } else {
      this.initShell();
    }

    const reconnectShell$ = this.conf().reconnectShell$;
    if (reconnectShell$) {
      reconnectShell$.pipe(untilDestroyed(this)).subscribe(() => {
        this.reconnect();
      });
    }

    this.store$.pipe(
      waitForPreferences,
      filter((preferences) => Boolean(preferences.sidenavStatus)),
      untilDestroyed(this),
    ).subscribe(() => {
      if (this.shellConnected()) {
        setTimeout(() => {
          this.resizeTerm();
        }, this.waitParentChanges);
      }
    });
  }

  @HostListener('window:resize')
  onWindowResized(): void {
    if (this.shellConnected()) {
      setTimeout(() => {
        this.resizeTerm();
      }, this.waitParentChanges);
    }
  }

  private initShell(): void {
    this.authService.getOneTimeToken().pipe(
      take(1),
      tap((token) => {
        this.token = token;
        this.initializeWebShell();
        this.initializeTerminal();
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  onResize(): void {
    this.resizeTerm();
  }

  private initializeTerminal(): void {
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

  private drawTerminal(): void {
    this.xterm.open(this.container().nativeElement);
    this.fitAddon.fit();
  }

  private updateTerminal(): void {
    if (this.shellConnected()) {
      this.xterm.clear();
    }

    if (this.attachAddon) {
      this.attachAddon.dispose();
    }

    this.attachAddon = new XtermAttachAddon(this.shellService);
    this.xterm.loadAddon(this.attachAddon);
  }

  private resizeTerm(): boolean {
    this.xterm.options.fontSize = this.fontSize;
    this.fitAddon.fit();
    const size = this.fitAddon.proposeDimensions();
    if (size && this.connectionId()) {
      this.api.call('core.resize_shell', [this.connectionId(), size.cols, size.rows]).pipe(untilDestroyed(this)).subscribe(() => {
        this.xterm.focus();
      });
    }
    return true;
  }

  protected onFontSizeChanged(newSize: number): void {
    this.fontSize = newSize;
    this.terminalSettings.fontSize = newSize;
    this.resizeTerm();
  }

  private initializeWebShell(): void {
    this.shellService.connect(this.token, this.conf().connectionData);

    this.shellService.shellConnected$
      .pipe(untilDestroyed(this))
      .subscribe((event: ShellConnectedEvent) => {
        this.shellConnected.set(event.connected);
        this.connectionId.set(event.id);

        if (event.connected) {
          this.isReconnecting.set(false);
          this.hasAttemptedAutoReconnect = false;
          this.updateTerminal();
          this.resizeTerm();
        } else {
          // Connection lost or failed
          this.isReconnecting.set(false);

          // Start immediate automatic reconnection for all shells (only once)
          if (this.autoReconnectEnabled && !this.hasAttemptedAutoReconnect) {
            this.hasAttemptedAutoReconnect = true;
            this.performAutoReconnect();
          }
        }
      });
  }

  reconnect(): void {
    this.isReconnecting.set(true);

    this.authService.getOneTimeToken().pipe(
      take(1),
      tap((token) => {
        this.token = token;
        this.shellService.connect(this.token, this.conf().connectionData);
      }),
      untilDestroyed(this),
    ).subscribe({
      error: () => {
        this.isReconnecting.set(false);
        // Manual reconnection failed - busy state will show reconnect button automatically
      },
    });
  }


  private performAutoReconnect(): void {
    if (!this.autoReconnectEnabled || this.shellConnected() || this.isReconnecting()) {
      return;
    }

    this.isReconnecting.set(true);

    this.authService.getOneTimeToken().pipe(
      take(1),
      tap((token) => {
        this.token = token;
        this.shellService.connect(this.token, this.conf().connectionData);
      }),
      untilDestroyed(this),
    ).subscribe({
      error: () => {
        this.isReconnecting.set(false);
        // Auto-reconnection failed, keep busy state to show manual reconnect option
      },
    });
  }

  isInstanceShell(): boolean {
    const data = this.conf().connectionData;
    return 'container_id' in data && 'use_console' in data;
  }

  ngOnDestroy(): void {
    this.shellService.disconnectIfSessionActive();
  }
}
