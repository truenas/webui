import { Component } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { switchMap } from 'rxjs/operators';
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

  consoleMsg: string;

  isShowConsole = false;

  consoleDialog: MatDialogRef<ConsolePanelDialogComponent>;

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
  }

  onOpenConsole(): void {
    this.consoleDialog = this.dialog.open(ConsolePanelDialogComponent, {});

    const consoleSubscription = this.consoleDialog.componentInstance.onEventEmitter
      .pipe(switchMap(() => this.ws.consoleMessages))
      .pipe(untilDestroyed(this)).subscribe((consoleMsg) => {
        this.consoleDialog.componentInstance.consoleMsg = consoleMsg;
      });

    this.consoleDialog.afterClosed().pipe(untilDestroyed(this)).subscribe(() => {
      clearInterval(this.consoleDialog.componentInstance.intervalPing);
      consoleSubscription.unsubscribe();
    });
  }
}
