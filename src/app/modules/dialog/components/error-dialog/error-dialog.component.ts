import { CdkScrollable } from '@angular/cdk/scrolling';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy, Component, ElementRef, ViewChild,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions,
} from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { Job } from 'app/interfaces/job.interface';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

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
    CdkScrollable,
    MatDialogContent,
    CopyButtonComponent,
    MatDialogActions,
    MatButton,
    TestIdModule,
    TranslateModule,
  ],
})
export class ErrorDialogComponent {
  @ViewChild('errorMessageWrapper') errorMessageWrapper: ElementRef;
  @ViewChild('errorTitle') errorTitle: ElementRef;
  @ViewChild('errorMdContent') errorMdContent: ElementRef;
  @ViewChild('errorBtPanel') errorBtPanel: ElementRef;
  @ViewChild('errorBtText') errorBtText: ElementRef;

  title: string;
  message: string;
  backtrace: string;
  isCloseMoreInfo = true;
  logs: Job;

  constructor(
    public dialogRef: MatDialogRef<ErrorDialogComponent>,
    private ws: WebSocketService,
    private download: DownloadService,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
  ) {}

  toggleOpen(): void {
    this.isCloseMoreInfo = !this.isCloseMoreInfo;
  }

  downloadLogs(): void {
    this.ws.call('core.job_download_logs', [this.logs.id, `${this.logs.id}.log`]).pipe(untilDestroyed(this)).subscribe({
      next: (url) => {
        const mimetype = 'text/plain';
        this.download.streamDownloadFile(url, `${this.logs.id}.log`, mimetype).pipe(untilDestroyed(this)).subscribe({
          next: (file) => {
            this.download.downloadBlob(file, `${this.logs.id}.log`);
            if (this.dialogRef) {
              this.dialogRef.close();
            }
          },
          error: (err: HttpErrorResponse) => {
            if (this.dialogRef) {
              this.dialogRef.close();
            }
            this.dialogService.error(this.errorHandler.parseHttpError(err));
          },
        });
      },
      error: (err) => {
        this.dialogService.error(this.errorHandler.parseError(err));
      },
    });
  }
}
