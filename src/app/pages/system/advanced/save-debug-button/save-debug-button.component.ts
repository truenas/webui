import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { EMPTY } from 'rxjs';
import {
  catchError, filter, switchMap, take, tap,
} from 'rxjs/operators';
import { helptextSystemAdvanced } from 'app/helptext/system/advanced';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/modules/entity/utils';
import { DialogService, StorageService, WebSocketService } from 'app/services';
import { AppState } from 'app/store';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-save-debug-button',
  templateUrl: './save-debug-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaveDebugButtonComponent {
  constructor(
    private ws: WebSocketService,
    private store$: Store<AppState>,
    private datePipe: DatePipe,
    private matDialog: MatDialog,
    private storage: StorageService,
    private translate: TranslateService,
    private dialogService: DialogService,
  ) {}

  onSaveDebug(): void {
    this.store$.pipe(
      waitForSystemInfo,
      switchMap((systemInfo) => {
        const hostname = systemInfo.hostname.split('.')[0];
        const date = this.datePipe.transform(new Date(), 'yyyyMMddHHmmss');
        const mimeType = 'application/gzip';
        const fileName = `debug-${hostname}-${date}.tgz`;
        return this.dialogService
          .confirm({
            title: helptextSystemAdvanced.dialog_generate_debug_title,
            message: helptextSystemAdvanced.dialog_generate_debug_message,
            hideCheckBox: true,
            buttonMsg: helptextSystemAdvanced.dialog_button_ok,
          })
          .pipe(
            filter(Boolean),
            switchMap(() => this.ws.call('core.download', ['system.debug', [], fileName, true])),
            tap(([jobId, url]) => {
              const dialogRef = this.matDialog.open(EntityJobComponent, {
                data: { title: this.translate.instant('Saving Debug') },
                disableClose: true,
              });
              dialogRef.componentInstance.jobId = jobId;
              dialogRef.componentInstance.wsshow();
              dialogRef.componentInstance.success
                .pipe(
                  take(1), // TODO: Only needed because of https://ixsystems.atlassian.net/browse/NAS-117633
                  switchMap(() => this.storage.streamDownloadFile(url, fileName, mimeType)),
                  untilDestroyed(this),
                )
                .subscribe({
                  next: (blob) => {
                    this.storage.downloadBlob(blob, fileName);
                    dialogRef.close();
                  },
                  error: (error) => {
                    dialogRef.close();
                    if (error instanceof HttpErrorResponse) {
                      this.dialogService.errorReport(error.name, error.message);
                    } else {
                      new EntityUtils().handleWsError(this, error, this.dialogService);
                    }
                  },
                });
              dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((error) => {
                this.matDialog.closeAll();
                new EntityUtils().handleWsError(this, error, this.dialogService);
              });
            }),
          );
      }),
      catchError((error) => {
        new EntityUtils().handleWsError(this, error, this.dialogService);
        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe(() => {});
  }
}
