import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { catchError, EMPTY, switchMap } from 'rxjs';
import { Job } from 'app/interfaces/job.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-show-logs-dialog',
  templateUrl: './show-logs-dialog.component.html',
  styleUrls: ['./show-logs-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowLogsDialogComponent {
  constructor(
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private download: DownloadService,
    private dialogService: DialogService,
    @Inject(MAT_DIALOG_DATA) public job: Job,
  ) { }

  downloadLogs(): void {
    this.ws.call('core.job_download_logs', [this.job.id, `${this.job.id}.log`]).pipe(
      switchMap((url) => this.download.downloadUrl(url, `${this.job.id}.log`, 'text/plain')),
      catchError((error: HttpErrorResponse | Job) => {
        this.dialogService.error(this.errorHandler.parseError(error));
        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe();
  }
}
