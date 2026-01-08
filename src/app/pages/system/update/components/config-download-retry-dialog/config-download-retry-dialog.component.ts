import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions,
} from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConfigDownloadRetryAction } from 'app/enums/config-download-retry.enum';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { ErrorParserService } from 'app/services/errors/error-parser.service';

export interface ConfigDownloadRetryDialogData {
  error: unknown;
}

@Component({
  selector: 'ix-config-download-retry-dialog',
  templateUrl: './config-download-retry-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    TranslateModule,
    ReactiveFormsModule,
    IxCheckboxComponent,
  ],
})
export class ConfigDownloadRetryDialog {
  private dialogRef = inject(MatDialogRef<ConfigDownloadRetryDialog>);
  protected data = inject<ConfigDownloadRetryDialogData>(MAT_DIALOG_DATA);
  private errorParser = inject(ErrorParserService);
  private translate = inject(TranslateService);

  protected acknowledgeRiskCheckbox = new FormControl(false);

  protected errorMessage = computed(() => {
    const errorReport = this.errorParser.parseError(this.data.error);
    const message = Array.isArray(errorReport)
      ? errorReport[0]?.message
      : errorReport?.message;

    return this.sanitizeErrorMessage(message || this.translate.instant('An unknown error occurred'));
  });

  /**
   * Sanitizes error messages to remove sensitive information like auth tokens from URLs.
   * Removes query parameters from URLs that appear in error messages.
   */
  private sanitizeErrorMessage(message: string): string {
    if (!message) {
      return this.translate.instant('An unknown error occurred');
    }

    // Remove URLs with query parameters (e.g., /_download/69?auth_token=...)
    // Replace with just the path or a generic message
    const sanitized = message.replace(
      /for\s+[^\s:]*\?[^\s:]*/g,
      'for download request',
    );

    return sanitized;
  }

  onRetry(): void {
    this.dialogRef.close(ConfigDownloadRetryAction.Retry);
  }

  onCancel(): void {
    this.dialogRef.close(ConfigDownloadRetryAction.Cancel);
  }

  onContinue(): void {
    this.dialogRef.close(ConfigDownloadRetryAction.Continue);
  }
}
