import {
  ChangeDetectionStrategy, Component, signal, Inject,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { switchMap, tap } from 'rxjs';
import { IfNightlyDirective } from 'app/directives/if-nightly/if-nightly.directive';
import { ErrorReport } from 'app/interfaces/error-report.interface';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-error-dialog',
  templateUrl: './error-dialog.component.html',
  styleUrls: ['./error-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    IxIconComponent,
    MatDialogContent,
    CopyButtonComponent,
    MatDialogActions,
    MatButton,
    TranslateModule,
    TestDirective,
    IfNightlyDirective,
  ],
})
export class ErrorDialog {
  protected isStackTraceOpen = signal(false);

  constructor(
    protected dialogRef: MatDialogRef<ErrorDialog>,
    private api: ApiService,
    private download: DownloadService,
    private errorHandler: ErrorHandlerService,
    @Inject(MAT_DIALOG_DATA) protected error: ErrorReport,
  ) {}

  protected toggleStackTrace(): void {
    this.isStackTraceOpen.set(!this.isStackTraceOpen());
  }

  protected downloadLogs(): void {
    const logsId = this.error.logs.id;
    this.api.call('core.job_download_logs', [logsId, `${logsId}.log`]).pipe(
      switchMap((url) => {
        const mimetype = 'text/plain';
        return this.download.streamDownloadFile(url, `${logsId}.log`, mimetype);
      }),
      tap((file) => this.download.downloadBlob(file, `${logsId}.log`)),
      this.errorHandler.withErrorHandler(),
      untilDestroyed(this),
    ).subscribe(() => this.dialogRef.close());
  }
}
