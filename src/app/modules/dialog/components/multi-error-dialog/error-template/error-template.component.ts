import {
  ChangeDetectionStrategy, Component, ElementRef, input, Signal, viewChild,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialogTitle } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { Job } from 'app/interfaces/job.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

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
  private readonly errorMessageWrapper: Signal<ElementRef<HTMLElement>> = viewChild.required('errorMessageWrapper', { read: ElementRef });
  private readonly errorMdContent: Signal<ElementRef<HTMLElement>> = viewChild.required('errorMdContent', { read: ElementRef });
  private readonly errorBtPanel: Signal<ElementRef<HTMLElement> | undefined> = viewChild('errorBtPanel', { read: ElementRef });
  private readonly errorBtText: Signal<ElementRef<HTMLElement> | undefined> = viewChild('errorBtText', { read: ElementRef });

  readonly title = input.required<string>();
  readonly message = input<string>();
  readonly backtrace = input<string>();
  readonly logs = input<Job>();

  isCloseMoreInfo = true;

  constructor(
    private api: ApiService,
    private download: DownloadService,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
  ) {}

  toggleOpen(): void {
    const messageWrapper = this.errorMessageWrapper().nativeElement;
    const content = this.errorMdContent().nativeElement;
    const btPanel = this.errorBtPanel()?.nativeElement;
    const txtarea = this.errorBtText()?.nativeElement;

    this.isCloseMoreInfo = !this.isCloseMoreInfo;
    if (!this.isCloseMoreInfo) {
      messageWrapper.setAttribute('style', 'max-height: 63px; overflow: auto');
      btPanel?.setAttribute('style', 'width: 750px; max-height: calc(80vh - 240px)');
    } else {
      content.removeAttribute('style');
      btPanel?.removeAttribute('style');
      messageWrapper.removeAttribute('style');
      txtarea?.removeAttribute('style');
    }
  }

  downloadLogs(): void {
    const logsId = this.logs()?.id;
    if (!logsId) {
      throw new Error('Missing logs id.');
    }

    this.api.call('core.job_download_logs', [logsId, `${logsId}.log`])
      .pipe(this.errorHandler.catchError(), untilDestroyed(this))
      .subscribe((url) => {
        const mimetype = 'text/plain';
        this.download.streamDownloadFile(url, `${logsId}.log`, mimetype).pipe(untilDestroyed(this)).subscribe({
          next: (file) => {
            this.download.downloadBlob(file, `${logsId}.log`);
          },
          error: (error: unknown) => {
            this.dialogService.error(this.errorHandler.parseError(error));
          },
        });
      });
  }
}
