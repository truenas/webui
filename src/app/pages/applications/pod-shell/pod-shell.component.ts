import {
  Component,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  Observable, of, Subject, Subscriber,
} from 'rxjs';
import helptext from 'app/helptext/shell/shell';
import { TerminalConfiguration } from 'app/interfaces/terminal.interface';
import { DialogFormConfiguration } from 'app/modules/entity/entity-dialog/dialog-form-configuration.interface';
import { PodSelectDialogComponent } from 'app/pages/applications/dialogs/pod-select/pod-select-dialog.component';
import { PodSelectDialogType } from 'app/pages/applications/enums/pod-select-dialog.enum';
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
    private mdDialog: MatDialog,
  ) {}

  preInit(): Observable<void> {
    return new Observable<void>((subscriber: Subscriber<void>) => {
      this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
        this.chartReleaseName = params['rname'];
        this.podName = params['pname'];
        this.command = params['cname'];

        this.ws.call('chart.release.pod_console_choices', [this.chartReleaseName]).pipe(untilDestroyed(this)).subscribe((consoleChoices) => {
          this.podDetails = { ...consoleChoices };

          const podDetail = this.podDetails[this.podName];
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
    this.mdDialog.open(PodSelectDialogComponent, {
      width: '50vw',
      minWidth: '650px',
      maxWidth: '850px',
      data: {
        appName: this.chartReleaseName,
        type: PodSelectDialogType.Shell,
        title: 'Choose pod',
        customSubmit: (podDialog: PodSelectDialogComponent) => this.onChooseShell(podDialog),
      },
    });
  }

  onChooseShell(podDialog: PodSelectDialogComponent): void {
    this.podName = podDialog.form.controls['pods'].value;
    this.containerName = podDialog.form.controls['containers'].value;
    this.command = podDialog.form.controls['command'].value;

    this.reconnectShell$.next();
    this.dialogService.closeAllDialogs();
  }

  afterShellDialogInit(podDialog: PodSelectDialogComponent): void {
    podDialog.form.controls.pods.valueChanges.pipe(untilDestroyed(this)).subscribe((pod) => {
      if (pod) {
        const containers = this.podDetails[pod];
        podDialog.containers$ = of(containers.map((item) => ({
          label: item,
          value: item,
        })));
        podDialog.form.controls.containers.setValue(containers[0]);
      } else {
        podDialog.containers$ = of(null);
        podDialog.form.controls.containers.setValue(null);
      }
    });
  }
}
