import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  combineLatest, Observable, Subject, Subscriber,
} from 'rxjs';
import { ShellDetailsDialogFormValue } from 'app/interfaces/shell-details-dialog.interface';
import { TerminalConfiguration, TerminalConnectionData } from 'app/interfaces/terminal.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { TerminalComponent } from 'app/modules/terminal/components/terminal/terminal.component';
import { ShellDetailsDialogComponent } from 'app/pages/apps/components/shell-details-dialog/shell-details-dialog.component';
import { ShellDetailsType } from 'app/pages/apps/enum/shell-details-type.enum';

@UntilDestroy()
@Component({
  selector: 'ix-container-shell',
  template: '<ix-terminal [conf]="this"></ix-terminal>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TerminalComponent,
  ],
})
export class ContainerShellComponent implements TerminalConfiguration {
  reconnectShell$ = new Subject<void>();

  protected appName: string;
  protected command: string;
  protected containerId: string;

  get connectionData(): TerminalConnectionData {
    return {
      podInfo: {
        chartReleaseName: this.appName,
        containerId: this.containerId,
        command: this.command,
      },
    };
  }

  constructor(
    private dialogService: DialogService,
    private aroute: ActivatedRoute,
    private matDialog: MatDialog,
  ) {}

  preInit(): Observable<void> {
    return new Observable<void>((subscriber: Subscriber<void>) => {
      combineLatest([this.aroute.params, this.aroute.parent.params]).pipe(
        untilDestroyed(this),
      ).subscribe(([params, parentParams]: [Record<string, unknown>, Record<string, unknown>]) => {
        this.appName = parentParams.appId as string;
        this.command = params.command as string;
        this.containerId = params.containerId as string;
        subscriber.next();
      });
    });
  }

  customReconnectAction(): void {
    this.matDialog.open(ShellDetailsDialogComponent, {
      minWidth: '650px',
      maxWidth: '850px',
      data: {
        appName: this.appName,
        type: ShellDetailsType.Shell,
        title: 'Choose container',
        customSubmit: (dialogFormValue: ShellDetailsDialogFormValue) => {
          this.onChooseShell(dialogFormValue, this.containerId);
        },
      },
    });
  }

  onChooseShell(value: ShellDetailsDialogFormValue, containerId: string): void {
    this.containerId = containerId;
    this.command = value.command;

    this.reconnectShell$.next();
    this.dialogService.closeAllDialogs();
  }
}
