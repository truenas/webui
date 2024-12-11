import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogTitle, MatDialogActions, MatDialogClose,
} from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, EMPTY, switchMap } from 'rxjs';
import { Job } from 'app/interfaces/job.interface';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ApiService } from 'app/services/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-show-logs-dialog',
  templateUrl: './show-logs-dialog.component.html',
  styleUrls: ['./show-logs-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    CopyButtonComponent,
    MatDialogActions,
    MatButton,
    MatDialogClose,
    TranslateModule,
    TestDirective,
  ],
})
export class ShowLogsDialogComponent {
  constructor(
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    private download: DownloadService,
    private dialogService: DialogService,
    @Inject(MAT_DIALOG_DATA) public job: Job,
  ) { }

  downloadLogs(): void {
    this.api.call('core.job_download_logs', [this.job.id, `${this.job.id}.log`]).pipe(
      switchMap((url) => this.download.downloadUrl(url, `${this.job.id}.log`, 'text/plain')),
      catchError((error: unknown) => {
        this.dialogService.error(this.errorHandler.parseError(error));
        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe();
  }
}
