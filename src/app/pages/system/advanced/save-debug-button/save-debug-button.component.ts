import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { select, Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { filter, switchMap, take } from 'rxjs/operators';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { observeJob } from 'app/helpers/operators/observe-job.operator';
import { helptextSystemAdvanced } from 'app/helptext/system/advanced';
import { ApiJobMethod } from 'app/interfaces/api/api-job-directory.interface';
import { Job } from 'app/interfaces/job.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { selectJob } from 'app/modules/jobs/store/job.selectors';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { saveDebugElement } from 'app/pages/system/advanced/save-debug-button/save-debug-button.elements';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-save-debug-button',
  templateUrl: './save-debug-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatButton,
    TestDirective,
    UiSearchDirective,
    TranslateModule,
  ],
  providers: [
    DatePipe,
  ],
})
export class SaveDebugButtonComponent {
  protected readonly searchableElement = saveDebugElement;

  constructor(
    private ws: WebSocketService,
    private store$: Store<AppState>,
    private datePipe: DatePipe,
    private errorHandler: ErrorHandlerService,
    private download: DownloadService,
    private translate: TranslateService,
    private dialogService: DialogService,
  ) {}

  onSaveDebugClicked(): void {
    this.dialogService
      .confirm({
        title: helptextSystemAdvanced.dialog_generate_debug_title,
        message: helptextSystemAdvanced.dialog_generate_debug_message,
        hideCheckbox: true,
        buttonText: helptextSystemAdvanced.dialog_button_ok,
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.saveDebug()),
        untilDestroyed(this),
      )
      .subscribe();
  }

  private saveDebug(): Observable<Blob> {
    return this.store$.pipe(
      waitForSystemInfo,
      take(1),
      switchMap((systemInfo) => {
        const hostname = systemInfo.hostname.split('.')[0];
        const date = this.datePipe.transform(new Date(), 'yyyyMMddHHmmss');
        const mimeType = 'application/gzip';
        const fileName = `debug-${hostname}-${date}.tgz`;

        return this.ws.call('core.download', ['system.debug', [], fileName, true]).pipe(
          switchMap(([jobId, url]) => {
            const job$ = this.store$.pipe(
              select(selectJob(jobId)),
              observeJob(),
            ) as Observable<Job<ApiJobMethod>>;
            return this.dialogService.jobDialog(job$, { title: this.translate.instant('Saving Debug') })
              .afterClosed()
              .pipe(switchMap(() => this.download.downloadUrl(url, fileName, mimeType)));
          }),
          this.errorHandler.catchError(),
        );
      }),
    );
  }
}
