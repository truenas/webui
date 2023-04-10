import {
  Component,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  Observable, Subject, Subscriber,
} from 'rxjs';
import helptext from 'app/helptext/shell/shell';
import { PodDialogFormValue } from 'app/interfaces/pod-select-dialog.interface';
import { TerminalConfiguration } from 'app/interfaces/terminal.interface';
import { PodSelectDialogComponent } from 'app/pages/apps-old/dialogs/pod-select/pod-select-dialog.component';
import { PodSelectDialogType } from 'app/pages/apps-old/enums/pod-select-dialog.enum';
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
        this.chartReleaseName = params.appId;
        this.podName = params.pname;
        this.command = params.cname;

        this.ws.call('chart.release.pod_console_choices', [this.chartReleaseName]).pipe(untilDestroyed(this)).subscribe((consoleChoices) => {
          this.podDetails = { ...consoleChoices };

          const podDetail = this.podDetails[this.podName];
          if (!podDetail) {
            this.dialogService.confirm({
              title: helptext.podConsole.nopod.title,
              message: helptext.podConsole.nopod.message,
              hideCheckbox: true,
              buttonText: this.translate.instant('Close'),
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
      minWidth: '650px',
      maxWidth: '850px',
      data: {
        appName: this.chartReleaseName,
        type: PodSelectDialogType.Shell,
        title: 'Choose pod',
        customSubmit: (dialogFormValue: PodDialogFormValue) => this.onChooseShell(dialogFormValue),
      },
    });
  }

  onChooseShell(value: PodDialogFormValue): void {
    this.podName = value.pods;
    this.containerName = value.containers;
    this.command = value.command;

    this.reconnectShell$.next();
    this.dialogService.closeAllDialogs();
  }
}
