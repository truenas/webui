import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogTitle, MatDialogActions, MatDialogClose,
} from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, EMPTY, switchMap } from 'rxjs';
import { Job } from 'app/interfaces/job.interface';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-show-logs-dialog',
  templateUrl: './show-logs-dialog.component.html',
  styleUrls: ['./show-logs-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
export class ShowLogsDialog {
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private download = inject(DownloadService);
  job = inject<Job>(MAT_DIALOG_DATA);
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
