import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { WebSocketService } from 'app/services';
import { DialogService } from 'app/services/dialog.service';

@UntilDestroy()
@Component({
  templateUrl: './config-reset.component.html',
  styleUrls: ['./config-reset.component.scss'],
})
export class ConfigResetComponent implements OnInit {
  constructor(
    protected ws: WebSocketService,
    protected router: Router,
    protected loader: AppLoaderService,
    public translate: TranslateService,
    protected dialogService: DialogService,
    protected dialog: MatDialog,
    private location: Location,
  ) {}

  isWsConnected(): void {
    if (this.ws.connected) {
      this.loader.close();
      // ws is connected
      this.router.navigate(['/session/signin']);
    } else {
      setTimeout(() => {
        this.isWsConnected();
      }, 1000);
    }
  }

  ngOnInit(): void {
    // Replace URL so that we don't reset config again if page is refreshed.
    this.location.replaceState('/session/signin');

    this.dialog.closeAll();
    this.resetConfigSubmit();
  }

  resetConfigSubmit(): void {
    const dialogRef = this.dialog.open(EntityJobComponent, { data: { title: this.translate.instant('Resetting. Please wait...') }, disableClose: true });
    dialogRef.componentInstance.setCall('config.reset', [{ reboot: true }]);
    dialogRef.componentInstance.setDescription(this.translate.instant('Resetting system configuration to default settings. The system will restart.'));
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      dialogRef.close();
      this.ws.prepareShutdown();
      this.loader.open();
      setTimeout(() => {
        this.isWsConnected();
      }, 15000);
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((failedJob) => {
      dialogRef.close();
      this.dialogService.errorReport(failedJob.error, failedJob.state, failedJob.exception);
    });
  }
}
