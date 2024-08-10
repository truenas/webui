import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  combineLatest, Observable, Subject, Subscriber,
} from 'rxjs';
import { helptextShell } from 'app/helptext/shell/shell';
import { PodDialogFormValue } from 'app/interfaces/pod-select-dialog.interface';
import { TerminalConfiguration, TerminalConnectionData } from 'app/interfaces/terminal.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
// import { PodSelectDialogComponent } from 'app/pages/apps/components/pod-select-dialog/pod-select-dialog.component';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-pod-shell',
  template: '<ix-terminal [conf]="this"></ix-terminal>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PodShellComponent implements TerminalConfiguration {
  reconnectShell$ = new Subject<void>();

  protected appName: string;
  protected podName: string;
  protected command: string;
  protected containerName: string;
  protected podDetails: Record<string, string[]>;

  get connectionData(): TerminalConnectionData {
    return {
      podInfo: {
        chartReleaseName: this.appName,
        podName: this.podName,
        containerName: this.containerName,
        command: this.command,
      },
    };
  }

  constructor(
    private ws: WebSocketService,
    private dialogService: DialogService,
    private aroute: ActivatedRoute,
    private translate: TranslateService,
    private matDialog: MatDialog,
    private cdr: ChangeDetectorRef,
  ) {}

  preInit(): Observable<void> {
    return new Observable<void>((subscriber: Subscriber<void>) => {
      combineLatest([this.aroute.params, this.aroute.parent.params]).pipe(
        untilDestroyed(this),
      ).subscribe(([params, parentParams]) => {
        this.appName = parentParams.appId as string;
        this.podName = params.podName as string;
        this.command = params.command as string;

        this.ws.call('chart.release.pod_console_choices', [this.appName]).pipe(untilDestroyed(this))
          .subscribe({
            next: (consoleChoices) => {
              this.podDetails = { ...consoleChoices };

              const podDetail = this.podDetails[this.podName];
              if (!podDetail) {
                this.dialogService.confirm({
                  title: helptextShell.podConsole.nopod.title,
                  message: helptextShell.podConsole.nopod.message,
                  hideCheckbox: true,
                  buttonText: this.translate.instant('Close'),
                  hideCancel: true,
                });
              } else {
                this.containerName = podDetail[0];
                subscriber.next();
              }

              this.cdr.markForCheck();
            },
            error: () => {
              this.cdr.markForCheck();
            },
          });
      });
    });
  }

  // TODO: https://ixsystems.atlassian.net/browse/NAS-130392
  // customReconnectAction(): void {
  //   this.matDialog.open(PodSelectDialogComponent, {
  //     minWidth: '650px',
  //     maxWidth: '850px',
  //     data: {
  //       appName: this.chartReleaseName,
  //       type: PodSelectDialogType.Shell,
  //       title: 'Choose pod',
  //       customSubmit: (dialogFormValue: PodDialogFormValue) => this.onChooseShell(dialogFormValue),
  //     },
  //   });
  // }

  onChooseShell(value: PodDialogFormValue): void {
    this.podName = value.pods;
    this.containerName = value.containers;
    this.command = value.command;

    this.reconnectShell$.next();
    this.dialogService.closeAllDialogs();
  }
}
