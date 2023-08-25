import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { CronjobRow } from 'app/pages/system/advanced/cron/cron-list/cronjob-row.interface';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './cron-delete-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CronDeleteDialogComponent {
  readonly deleteMessage = T('Are you sure you want to delete cronjob <b>"{name}"</b>?');

  constructor(
    private loader: AppLoaderService,
    private ws: WebSocketService,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private dialogRef: MatDialogRef<CronDeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public cronjob: CronjobRow,
    private errorHandler: ErrorHandlerService,
  ) { }

  onDelete(): void {
    this.ws.call('cronjob.delete', [this.cronjob.id])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Cronjob deleted'));
        this.dialogRef.close(true);
      });
  }
}
