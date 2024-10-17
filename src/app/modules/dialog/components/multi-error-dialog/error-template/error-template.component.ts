import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy, Component, ElementRef, Input, ViewChild,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialogTitle } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { Job } from 'app/interfaces/job.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-error-template',
  templateUrl: './error-template.component.html',
  styleUrls: ['./error-template.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    IxIconComponent,
    MatButton,
    TranslateModule,
    TestDirective,
  ],
})
export class ErrorTemplateComponent {
  @ViewChild('errorMessageWrapper') errorMessageWrapper: ElementRef<HTMLElement>;
  @ViewChild('errorTitle') errorTitle: ElementRef<HTMLElement>;
  @ViewChild('errorMdContent') errorMdContent: ElementRef<HTMLElement>;
  @ViewChild('errorBtPanel') errorBtPanel: ElementRef<HTMLElement>;
  @ViewChild('errorBtText') errorBtText: ElementRef<HTMLElement>;

  @Input() title: string;
  @Input() message: string;
  @Input() backtrace: string;
  isCloseMoreInfo = true;
  @Input() logs: Job;

  constructor(
    private ws: WebSocketService,
    private download: DownloadService,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
  ) {}

  toggleOpen(): void {
    const messageWrapper = this.errorMessageWrapper.nativeElement;
    const content = this.errorMdContent.nativeElement;
    const btPanel = this.errorBtPanel.nativeElement;
    const txtarea = this.errorBtText.nativeElement;

    this.isCloseMoreInfo = !this.isCloseMoreInfo;
    if (!this.isCloseMoreInfo) {
      messageWrapper.setAttribute('style', 'max-height: 63px; overflow: auto');
      btPanel.setAttribute('style', 'width: 750px; max-height: calc(80vh - 240px)');
    } else {
      content.removeAttribute('style');
      btPanel.removeAttribute('style');
      messageWrapper.removeAttribute('style');
      txtarea.removeAttribute('style');
    }
  }

  downloadLogs(): void {
    this.ws.call('core.job_download_logs', [this.logs.id, `${this.logs.id}.log`])
      .pipe(this.errorHandler.catchError(), untilDestroyed(this))
      .subscribe((url) => {
        const mimetype = 'text/plain';
        this.download.streamDownloadFile(url, `${this.logs.id}.log`, mimetype).pipe(untilDestroyed(this)).subscribe({
          next: (file) => {
            this.download.downloadBlob(file, `${this.logs.id}.log`);
          },
          error: (error: HttpErrorResponse) => {
            this.dialogService.error(this.errorHandler.parseHttpError(error));
          },
        });
      });
  }
}
