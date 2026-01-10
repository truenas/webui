import { HttpErrorResponse } from '@angular/common/http';
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
    // For HTTP errors, just show the status code without the URL
    if (this.data.error instanceof HttpErrorResponse) {
      return this.translate.instant('HTTP {status} error', { status: this.data.error.status });
    }

    // For other errors, use the error parser
    const errorReport = this.errorParser.parseError(this.data.error);
    const message = Array.isArray(errorReport)
      ? errorReport[0]?.message
      : errorReport?.message;

    return message || this.translate.instant('An unknown error occurred');
  });

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
