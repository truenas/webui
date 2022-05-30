import {
  Component,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { Observable, Subject, Subscriber } from 'rxjs';
import helptext from 'app/helptext/shell/shell';
import { TerminalConfiguration } from 'app/interfaces/terminal.interface';
import { DialogFormConfiguration } from 'app/modules/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/modules/entity/entity-dialog/entity-dialog.component';
import { FormSelectConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { DialogService, ShellService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  template: '<ix-terminal [conf]="this"></ix-terminal>',
})
export class PodShellComponent implements TerminalConfiguration {
  reconnectShell$ = new Subject<void>();

  protected chartReleaseName: string;
  protected podName: string;
  protected command: string;
  protected containerName: string;
  protected podDetails: Record<string, string[]>;

  choosePod: DialogFormConfiguration;

  constructor(
    private ws: WebSocketService,
    private dialogService: DialogService,
    private aroute: ActivatedRoute,
    private translate: TranslateService,
  ) {}

  preInit(): Observable<void> {
    return new Observable<void>((subscriber: Subscriber<void>) => {
      this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
        this.chartReleaseName = params['rname'];
        this.podName = params['pname'];
        this.command = params['cname'];

        this.ws.call('chart.release.pod_console_choices', [this.chartReleaseName]).pipe(untilDestroyed(this)).subscribe((res) => {
          this.podDetails = res;

          const podDetail = res[this.podName];
          if (!podDetail) {
            this.dialogService.confirm({
              title: helptext.podConsole.nopod.title,
              message: helptext.podConsole.nopod.message,
              hideCheckBox: true,
              buttonMsg: this.translate.instant('Close'),
              hideCancel: true,
            });
          } else {
            this.containerName = podDetail[0];
            this.updateChooseShellDialog();

            subscriber.next();
          }
        });
      });
    });
  }

  setShellConnectionData(shellService: ShellService): void {
    shellService.podInfo = {
      chart_release_name: this.chartReleaseName,
      pod_name: this.podName,
      container_name: this.containerName,
      command: this.command,
    };
  }

  customReconnectAction(): void {
    this.updateChooseShellDialog();
    this.dialogService.dialogForm(this.choosePod, true);
  }

  updateChooseShellDialog(): void {
    this.choosePod = {
      title: helptext.podConsole.choosePod.title,
      fieldConfig: [{
        type: 'select',
        name: 'pods',
        placeholder: helptext.podConsole.choosePod.placeholder,
        required: true,
        value: this.podName,
        options: Object.keys(this.podDetails).map((item) => ({
          label: item,
          value: item,
        })),
      }, {
        type: 'select',
        name: 'containers',
        placeholder: helptext.podConsole.chooseContainer.placeholder,
        required: true,
        value: this.containerName,
        options: this.podDetails[this.podName].map((item) => ({
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
      customSubmit: (entityDialog) => this.onChooseShell(entityDialog),
      afterInit: (entityDialog) => this.afterShellDialogInit(entityDialog),
    };
  }

  onChooseShell(entityDialog: EntityDialogComponent): void {
    this.podName = entityDialog.formGroup.controls['pods'].value;
    this.containerName = entityDialog.formGroup.controls['containers'].value;
    this.command = entityDialog.formGroup.controls['command'].value;

    this.reconnectShell$.next();
    this.dialogService.closeAllDialogs();
  }

  afterShellDialogInit(entityDialog: EntityDialogComponent): void {
    entityDialog.formGroup.controls['pods'].valueChanges.pipe(untilDestroyed(this)).subscribe((value) => {
      const containers = this.podDetails[value];
      const containerFc = _.find(entityDialog.fieldConfig, { name: 'containers' }) as FormSelectConfig;
      containerFc.options = containers.map((item) => ({
        label: item,
        value: item,
      }));
      entityDialog.formGroup.controls['containers'].setValue(containers[0]);
    });
  }
}
