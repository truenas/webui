import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnDialogShellComponent } from '@truenas/ui-components';
import { catchError, EMPTY, switchMap } from 'rxjs';
import { Job } from 'app/interfaces/job.interface';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-show-logs-dialog',
  templateUrl: './show-logs-dialog.component.html',
  styleUrls: ['./show-logs-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    TnButtonComponent,
    CopyButtonComponent,
    TranslateModule,
  ],
})
export class ShowLogsDialog {
  protected dialogRef = inject<DialogRef<void, ShowLogsDialog>>(DialogRef);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private download = inject(DownloadService);
  job = inject<Job>(DIALOG_DATA);
  private destroyRef = inject(DestroyRef);

  downloadLogs(): void {
    this.api.call('core.job_download_logs', [this.job.id, `${this.job.id}.log`]).pipe(
      switchMap((url) => this.download.downloadUrl(url, `${this.job.id}.log`, 'text/plain')),
      catchError((error: unknown) => {
        this.errorHandler.showErrorModal(error);
        return EMPTY;
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }
}
