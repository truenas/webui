import {
  Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as FontFaceObserver from 'fontfaceobserver';
import { Observable } from 'rxjs';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { XtermAttachAddon } from 'app/core/classes/xterm-attach-addon';
import { ShellConnectedEvent } from 'app/interfaces/shell.interface';
import { CopyPasteMessageComponent } from 'app/pages/shell/copy-paste-message.component';
import { ShellService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'app-vmserial-shell',
  templateUrl: './vmserial-shell.component.html',
  styleUrls: ['./vmserial-shell.component.scss'],
  providers: [ShellService],
  // eslint-disable-next-line @angular-eslint/use-component-view-encapsulation
  encapsulation: ViewEncapsulation.None,
})
export class VMSerialShellComponent implements OnInit, OnDestroy {
  @ViewChild('terminal', { static: true }) container: ElementRef;
  font_size = 14;
  font_name = 'Inconsolata';
  connectionId: string;
  token: any;
  xterm: Terminal;
  private fitAddon: FitAddon;

  protected pk: string;

  constructor(
    private ws: WebSocketService,
    private ss: ShellService,
    private aroute: ActivatedRoute,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.pk = params['pk'];
      this.getAuthToken().pipe(untilDestroyed(this)).subscribe((token) => {
        this.initializeWebShell(token);
        this.ss.shellOutput.pipe(untilDestroyed(this)).subscribe();
        this.initializeTerminal();
      });
    });
  }

  ngOnDestroy(): void {
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

  initializeTerminal(): void {
    const setting = {
      cursorBlink: false,
      tabStopWidth: 8,
      cols: 80,
      rows: 20,
      focus: true,
      fontSize: this.font_size,
      fontFamily: this.font_name,
    };

    this.xterm = new Terminal(setting);
    const attachAddon = new XtermAttachAddon(this.ss.socket);
    this.xterm.loadAddon(attachAddon);
    this.fitAddon = new FitAddon();
    this.xterm.loadAddon(this.fitAddon);

    const font = new FontFaceObserver(this.font_name);

    font.load().then(() => {
      this.xterm.open(this.container.nativeElement);
      this.fitAddon.fit();
      (this.xterm as any)._initialized = true;
    }, (e) => {
      console.error('Font is not available', e);
    });
  }

  resizeTerm(): boolean {
    this.xterm.setOption('fontSize', this.font_size);
    this.fitAddon.fit();
    const size = this.fitAddon.proposeDimensions();
    this.ws.call('core.resize_shell', [this.connectionId, size.cols, size.rows]).pipe(untilDestroyed(this)).subscribe(() => {
      this.xterm.focus();
    });
    return true;
  }

  initializeWebShell(token: string): void {
    this.ss.vmId = Number(this.pk);
    this.ss.token = token;
    this.ss.connect();

    this.ss.shellConnected.pipe(untilDestroyed(this)).subscribe((res: ShellConnectedEvent) => {
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
