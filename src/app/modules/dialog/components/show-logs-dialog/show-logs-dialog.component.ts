import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { switchMap, catchError, EMPTY } from 'rxjs';
import { Job } from 'app/interfaces/job.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { StorageService } from 'app/services/storage.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './show-logs-dialog.component.html',
  styleUrls: ['./show-logs-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowLogsDialogComponent {
  constructor(
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private storage: StorageService,
    private dialogService: DialogService,
    @Inject(MAT_DIALOG_DATA) public job: Job,
  ) { }

  downloadLogs(): void {
    this.ws.call('core.job_download_logs', [this.job.id, `${this.job.id}.log`]).pipe(
      switchMap((url) => this.storage.downloadUrl(url, `${this.job.id}.log`, 'text/plain')),
      catchError((error: HttpErrorResponse) => {
        this.dialogService.error(this.errorHandler.parseHttpError(error));
        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe();
  }
}
