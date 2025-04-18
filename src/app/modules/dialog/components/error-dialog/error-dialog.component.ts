import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions,
} from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { Job } from 'app/interfaces/job.interface';
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
  imports: [
    MatDialogTitle,
    IxIconComponent,
    MatDialogContent,
    CopyButtonComponent,
    MatDialogActions,
    MatButton,
    TranslateModule,
    TestDirective,
  ],
})
export class ErrorDialog {
  title: string;
  message: string;
  backtrace?: string;
  isCloseMoreInfo = true;
  logs: Job;

  constructor(
    public dialogRef: MatDialogRef<ErrorDialog>,
    private api: ApiService,
    private download: DownloadService,
    private errorHandler: ErrorHandlerService,
  ) {}

  toggleOpen(): void {
    this.isCloseMoreInfo = !this.isCloseMoreInfo;
  }

  downloadLogs(): void {
    this.api.call('core.job_download_logs', [this.logs.id, `${this.logs.id}.log`]).pipe(untilDestroyed(this)).subscribe({
      next: (url) => {
        const mimetype = 'text/plain';
        this.download.streamDownloadFile(url, `${this.logs.id}.log`, mimetype).pipe(untilDestroyed(this)).subscribe({
          next: (file) => {
            this.download.downloadBlob(file, `${this.logs.id}.log`);
            if (this.dialogRef) {
              this.dialogRef.close();
            }
          },
          error: (error: unknown) => {
            if (this.dialogRef) {
              this.dialogRef.close();
            }
            this.errorHandler.showErrorModal(error);
          },
        });
      },
      error: (error: unknown) => {
        this.errorHandler.showErrorModal(error);
      },
    });
  }
}
