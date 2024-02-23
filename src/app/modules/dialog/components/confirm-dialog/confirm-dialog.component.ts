import {
  ChangeDetectionStrategy,
  Component, Inject,
} from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmOptions, ConfirmOptionsWithSecondaryCheckbox } from 'app/interfaces/dialog.interface';

@Component({
  selector: 'ix-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  options: ConfirmOptionsWithSecondaryCheckbox;

  isSubmitEnabled = false;
  isSecondaryCheckboxChecked = false;

  private readonly defaultOptions = {
    buttonText: this.translate.instant('Continue'),
    cancelText: this.translate.instant('Cancel'),
    hideCheckbox: false,
    confirmationCheckboxText: this.translate.instant('Confirm'),
  } as ConfirmOptions;

  constructor(
    private dialogRef: MatDialogRef<ConfirmDialogComponent>,
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) options: ConfirmOptionsWithSecondaryCheckbox,
  ) {
    this.options = { ...this.defaultOptions, ...options };
    if (options.hideCancel) {
      this.dialogRef.disableClose = options.hideCancel;
    }

    if (options.secondaryCheckbox) {
      // Don't allow user to close via backdrop to ensure that object is returned.
      this.dialogRef.disableClose = true;
    }
  }

  toggleSubmit(data: MatCheckboxChange): void {
    this.isSubmitEnabled = data.checked;
  }

  isDisabled(): boolean {
    if (!this.options.hideCheckbox) {
      return !this.isSubmitEnabled && !this.options.hideCheckbox;
    }
    return false;
  }

  onCancel(): void {
    const result = this.options.secondaryCheckbox
      ? {
        confirmed: false,
        secondaryCheckbox: this.isSecondaryCheckboxChecked,
      }
      : false;

    this.dialogRef.close(result);
  }

  onSubmit(): void {
    const result = this.options.secondaryCheckbox
      ? {
        confirmed: true,
        secondaryCheckbox: this.isSecondaryCheckboxChecked,
      }
      : true;

    this.dialogRef.close(result);
  }
}
