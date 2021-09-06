import {
  Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as FontFaceObserver from 'fontfaceobserver';
import * as _ from 'lodash';
import { Subject, Observable } from 'rxjs';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { XtermAttachAddon } from 'app/core/classes/xterm-attach-addon';
import { CoreService } from 'app/core/services/core-service/core.service';
import helptext from 'app/helptext/shell/shell';
import { CoreEvent } from 'app/interfaces/events';
import { ShellConnectedEvent } from 'app/interfaces/shell.interface';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { FormSelectConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { EntityToolbarComponent } from 'app/pages/common/entity/entity-toolbar/entity-toolbar.component';
import { CopyPasteMessageComponent } from 'app/pages/shell/copy-paste-message.component';
import { DialogService, ShellService, WebSocketService } from 'app/services';
import { T } from 'app/translate-marker';

@UntilDestroy()
@Component({
  selector: 'app-pod-shell',
  templateUrl: './pod-shell.component.html',
  styleUrls: ['./pod-shell.component.scss'],
  providers: [ShellService],
  // eslint-disable-next-line @angular-eslint/use-component-view-encapsulation
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
  xterm: Terminal;
  private fitAddon: FitAddon;
  private attachAddon: XtermAttachAddon;
  formEvent$: Subject<CoreEvent>;

  shellConnected = false;
  connectionId: string;
  protected chart_release_name: string;
  protected pod_name: string;
  protected command: string;
  protected containerName: string;
  protected podDetails: Record<string, string[]>;

  protected route_success: string[] = ['apps'];

  choosePod: DialogFormConfiguration;

  constructor(
    private core: CoreService,
    private ws: WebSocketService,
    private ss: ShellService,
    private dialogService: DialogService,
    private aroute: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.chart_release_name = params['rname'];
      this.pod_name = params['pname'];
      this.command = params['cname'];

      this.ws.call('chart.release.pod_console_choices', [this.chart_release_name]).pipe(untilDestroyed(this)).subscribe((res) => {
        this.podDetails = res;

        const podDetail = res[this.pod_name];
        if (!podDetail) {
          this.dialogService.confirm({
            title: helptext.podConsole.nopod.title,
            message: helptext.podConsole.nopod.message,
            hideCheckBox: true,
            buttonMsg: T('Close'),
            hideCancel: true,
          });
        } else {
          this.containerName = podDetail[0];
          this.updateChooseShellDialog();

          this.getAuthToken().pipe(untilDestroyed(this)).subscribe((token) => {
            this.initializeWebShell(token);

            this.ss.shellOutput.pipe(untilDestroyed(this)).subscribe((value) => {
              if (value !== undefined) {
                if (_.trim(value as any) == 'logout') {
                  this.xterm.dispose();
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
  }

  refreshToolbarButtons(): void {
    this.formEvent$ = new Subject();
    this.formEvent$.pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
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
        target: this.formEvent$,
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
    const setting = {
      cursorBlink: false,
      tabStopWidth: 8,
      cols: 80,
      rows: 20,
      focus: true,
      fontSize: this.font_size,
      fontFamily: this.font_name,
      allowTransparency: true,
    };

    this.xterm = new Terminal(setting);

    this.fitAddon = new FitAddon();
    this.xterm.loadAddon(this.fitAddon);

    const font = new FontFaceObserver(this.font_name);

    font.load().then(() => {
      this.xterm.open(this.container.nativeElement);
      this.fitAddon.fit();
    }, (e) => {
      console.error('Font is not available', e);
    });
  }

  updateTerminal(): void {
    if (this.shellConnected) {
      this.xterm.clear();
    }

    if (this.attachAddon) {
      this.attachAddon.dispose();
    }

    this.attachAddon = new XtermAttachAddon(this.ss.socket);
    this.xterm.loadAddon(this.attachAddon);
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
    this.ss.token = token;
    this.reconnect();
    this.initializeTerminal();
    this.refreshToolbarButtons();

    this.ss.shellConnected.pipe(untilDestroyed(this)).subscribe((res: ShellConnectedEvent) => {
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
      container_name: this.containerName,
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
        value: this.containerName,
        options: this.podDetails[this.pod_name].map((item) => ({
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

  onChooseShell(entityDialog: EntityDialogComponent<this>): void {
    const self = entityDialog.parent;
    self.pod_name = entityDialog.formGroup.controls['pods'].value;
    self.containerName = entityDialog.formGroup.controls['containers'].value;
    self.command = entityDialog.formGroup.controls['command'].value;

    self.reconnect();
    self.dialogService.closeAllDialogs();
  }

  afterShellDialogInit(entityDialog: EntityDialogComponent): void {
    const self = entityDialog.parent;

    entityDialog.formGroup.controls['pods'].valueChanges.pipe(untilDestroyed(parent)).subscribe((value) => {
      const containers = self.podDetails[value] as string[];
      const containerFC: FormSelectConfig = _.find(entityDialog.fieldConfig, { name: 'containers' });
      containerFC.options = containers.map((item) => ({
        label: item,
        value: item,
      }));
      entityDialog.formGroup.controls['containers'].setValue(containers[0]);
    });
  }
}
