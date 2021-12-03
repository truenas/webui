import { Component } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subscription } from 'rxjs';
import {
  filter, map,
} from 'rxjs/operators';
import { ConsolePanelDialogComponent } from 'app/components/common/dialog/console-panel/console-panel-dialog.component';
import { SystemGeneralService } from 'app/services/system-general.service';
import { WebSocketService } from '../ws.service';

@UntilDestroy()
@Component({
  selector: 'app-app-loader',
  templateUrl: './app-loader.component.html',
  styleUrls: ['./app-loader.component.scss'],
})
export class AppLoaderComponent {
  title: string;
  message: string;
  consoleMsg = '';
  consoleMsgSubscription: Subscription;
  consoleDialogSubscription: Subscription;
  isShowConsole = false;
  consoleDialogRef: MatDialogRef<ConsolePanelDialogComponent>;

  constructor(
    public dialogRef: MatDialogRef<AppLoaderComponent>,
    private dialog: MatDialog,
    private ws: WebSocketService,
    private sysGeneralService: SystemGeneralService,
  ) {
    this.sysGeneralService.getAdvancedConfig$
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res.consolemsg) {
          this.isShowConsole = true;
          this.dialogRef.updateSize('200px', '248px');
        }
      });
    this.dialogRef.beforeClosed().pipe(untilDestroyed(this)).subscribe(() => {
      if (this.consoleDialogRef) {
        this.consoleDialogRef.close();
      }
    });
  }

  getLogConsoleMsg(): void {
    const subName = 'filesystem.file_tail_follow:/var/log/messages:499';

    this.consoleMsgSubscription = this.ws.sub(subName).pipe(
      filter((res) => res && res.data && typeof res.data === 'string'),
      map((res) => res.data),
      untilDestroyed(this),
    ).subscribe((consoleData) => {
      this.consoleMsg = consoleData;
    });
  }

  onShowConsolePanel(): void {
    this.getLogConsoleMsg();
    this.consoleDialogRef = this.dialog.open(ConsolePanelDialogComponent, {});
    this.consoleDialogSubscription = this.consoleDialogRef.componentInstance.onEventEmitter
      .pipe(untilDestroyed(this)).subscribe(() => {
        this.consoleDialogRef.componentInstance.consoleMsg = this.consoleMsg;
      });

    this.consoleDialogRef.beforeClosed().pipe(untilDestroyed(this)).subscribe(() => {
      clearInterval(this.consoleDialogRef.componentInstance.intervalPing);
      this.consoleDialogSubscription.unsubscribe();
      this.consoleMsgSubscription.unsubscribe();
      this.consoleDialogRef = null;
    });
  }
}
