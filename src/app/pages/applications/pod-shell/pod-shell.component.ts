import {
  Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as FontFaceObserver from 'fontfaceobserver';
import * as _ from 'lodash';
import { Subject, Observable } from 'rxjs';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { XtermAttachAddon } from 'app/core/classes/xterm-attach-addon';
import { CoreService } from 'app/core/services/core.service';
import helptext from 'app/helptext/shell/shell';
import { CoreEvent } from 'app/interfaces/events';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityToolbarComponent } from 'app/pages/common/entity/entity-toolbar/entity-toolbar.component';
import { CopyPasteMessageComponent } from 'app/pages/shell/copy-paste-message.component';
import { DialogService, ShellService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'app-pod-shell',
  templateUrl: './pod-shell.component.html',
  styleUrls: ['./pod-shell.component.scss'],
  providers: [ShellService],
  encapsulation: ViewEncapsulation.None,
})

export class PodShellComponent implements OnInit, OnDestroy {
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
  protected chart_release_name: string;
  protected pod_name: string;
  protected command: string;
  protected conatiner_name: string;
  protected podDetails: any;

  protected route_success: string[] = ['apps'];

  choosePod: DialogFormConfiguration;

  constructor(protected core: CoreService,
    private ws: WebSocketService,
    public ss: ShellService,
    private dialogService: DialogService,
    public translate: TranslateService,
    protected aroute: ActivatedRoute,
    protected router: Router,
    private dialog: MatDialog) {
  }

  ngOnInit(): void {
    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.chart_release_name = params['rname'];
      this.pod_name = params['pname'];
      this.command = params['cname'];

      this.ws.call('chart.release.pod_console_choices', [this.chart_release_name]).pipe(untilDestroyed(this)).subscribe((res) => {
        this.podDetails = res;

        const podDetail = res[this.pod_name];
        if (!podDetail) {
          this.dialogService.confirm(helptext.podConsole.nopod.title, helptext.podConsole.nopod.message, true, 'Close', false, null, null, null, null, true);
        } else {
          this.conatiner_name = podDetail[0];
          this.updateChooseShellDialog();

          this.getAuthToken().pipe(untilDestroyed(this)).subscribe((token) => {
            this.initializeWebShell(token);

            this.shellSubscription = this.ss.shellOutput.pipe(untilDestroyed(this)).subscribe((value: any) => {
              if (value !== undefined) {
                if (_.trim(value) == 'logout') {
                  this.xterm.destroy();
                  this.router.navigate(new Array('/').concat(this.route_success));
                }
              }
            });
          });
        }
      });
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
  }

  refreshToolbarButtons(): void {
    this.formEvents = new Subject();
    this.formEvents.pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      if (evt.data.event_control == 'restore') {
        this.resetDefault();
        this.refreshToolbarButtons();
      } else if (evt.data.event_control == 'reconnect') {
        this.showChooseShellDialog();
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
          name: 'reconnect',
          label: 'Reconnect',
          type: 'button',
          color: 'secondary',
        },
        {
          name: 'restore',
          label: 'Restore default',
          type: 'button',
          color: 'primary',
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

  updateTerminal(): void {
    if (this.shellConnected) {
      this.xterm.clear();
    }
    const attachAddon = new XtermAttachAddon(this.ss.socket);
    this.xterm.loadAddon(attachAddon);
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
    this.reconnect();
    this.initializeTerminal();
    this.refreshToolbarButtons();

    this.shellConnectedSubscription = this.ss.shellConnected.pipe(untilDestroyed(this)).subscribe((res: any) => {
      this.shellConnected = res.connected;
      this.connectionId = res.id;
      this.updateTerminal();
      this.refreshToolbarButtons();
      this.resizeTerm();
    });
  }

  getAuthToken(): Observable<string> {
    return this.ws.call('auth.generate_token');
  }

  reconnect(): void {
    this.ss.podInfo = {
      chart_release_name: this.chart_release_name,
      pod_name: this.pod_name,
      container_name: this.conatiner_name,
      command: this.command,
    };
    this.ss.connect();
  }

  updateChooseShellDialog(): void {
    this.choosePod = {
      title: helptext.podConsole.choosePod.title,
      fieldConfig: [{
        type: 'select',
        name: 'pods',
        placeholder: helptext.podConsole.choosePod.placeholder,
        required: true,
        value: this.pod_name,
        options: Object.keys(this.podDetails).map((item) => ({
          label: item,
          value: item,
        })),
      }, {
        type: 'select',
        name: 'containers',
        placeholder: helptext.podConsole.chooseConatiner.placeholder,
        required: true,
        value: this.conatiner_name,
        options: this.podDetails[this.pod_name].map((item: any) => ({
          label: item,
          value: item,
        })),
      }, {
        type: 'input',
        name: 'command',
        placeholder: helptext.podConsole.chooseCommand.placeholder,
        value: this.command,
      }],
      saveButtonText: helptext.podConsole.choosePod.action,
      customSubmit: this.onChooseShell,
      afterInit: this.afterShellDialogInit,
      parent: this,
    };
  }

  showChooseShellDialog(): void {
    this.updateChooseShellDialog();
    this.dialogService.dialogForm(this.choosePod, true);
  }

  onChooseShell(entityDialog: any): void {
    const self = entityDialog.parent;
    self.pod_name = entityDialog.formGroup.controls['pods'].value;
    self.conatiner_name = entityDialog.formGroup.controls['containers'].value;
    self.command = entityDialog.formGroup.controls['command'].value;

    self.reconnect();
    self.dialogService.closeAllDialogs();
  }

  afterShellDialogInit(entityDialog: any): void {
    const self = entityDialog.parent;

    entityDialog.formGroup.controls['pods'].valueChanges.pipe(untilDestroyed(this)).subscribe((value: any) => {
      const containers = self.podDetails[value];
      const containerFC = _.find(entityDialog.fieldConfig, { name: 'containers' });
      containerFC.options = containers.map((item: any) => ({
        label: item,
        value: item,
      }));
      entityDialog.formGroup.controls['containers'].setValue(containers[0]);
    });
  }
}
