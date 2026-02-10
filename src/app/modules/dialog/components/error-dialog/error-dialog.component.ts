import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { switchMap, tap } from 'rxjs';
import { ErrorReport, ErrorReportAction, collapsibleDetailLabels } from 'app/interfaces/error-report.interface';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
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
    TnIconComponent,
    MatDialogContent,
    CopyButtonComponent,
    MatDialogActions,
    MatButton,
    TranslateModule,
    TestDirective,
  ],
})
export class ErrorDialog {
  protected dialogRef = inject<MatDialogRef<ErrorDialog>>(MatDialogRef);
  private api = inject(ApiService);
  private download = inject(DownloadService);
  private errorHandler = inject(ErrorHandlerService);
  private router = inject(Router);
  protected error = inject<ErrorReport>(MAT_DIALOG_DATA);

  protected isDetailsOpen = signal(false);
  protected expandedDetails = signal(new Set<string>());

  protected toggleDetails(): void {
    this.isDetailsOpen.set(!this.isDetailsOpen());
  }

  protected isCollapsibleDetail(label: string): boolean {
    return collapsibleDetailLabels.has(label);
  }

  protected isDetailExpanded(label: string): boolean {
    return this.expandedDetails().has(label);
  }

  protected toggleDetailExpanded(label: string): void {
    this.expandedDetails.update((current) => {
      const next = new Set(current);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }

  protected getDetailsAsText(): string {
    if (!this.error.details) {
      return '';
    }
    return this.error.details
      .map((detail) => `${detail.label}: ${detail.value}`)
      .join('\n');
  }

  protected downloadLogs(): void {
    if (!this.error.logs) {
      return;
    }
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

  protected handleAction(action: ErrorReportAction): void {
    if (action.route) {
      this.router.navigate([action.route], { queryParams: action.params });
      this.dialogRef.close();
    } else if (action.action) {
      action.action();
      this.dialogRef.close();
    }
  }
}
