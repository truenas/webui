import { CdkScrollable } from '@angular/cdk/scrolling';
import {
  ChangeDetectionStrategy,
  Component, Inject,
} from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCheckboxChange, MatCheckbox } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions,
} from '@angular/material/dialog';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { ConfirmOptions, ConfirmOptionsWithSecondaryCheckbox, DialogWithSecondaryCheckboxResult } from 'app/interfaces/dialog.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    CdkScrollable,
    MatDialogContent,
    MatCheckbox,
    ReactiveFormsModule,
    FormsModule,
    FormActionsComponent,
    MatDialogActions,
    MatButton,
    TranslateModule,
    TestDirective,
  ],
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

    if (this.withSecondaryCheckbox) {
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
    const result = this.withSecondaryCheckbox
      ? {
          confirmed: false,
          secondaryCheckbox: this.isSecondaryCheckboxChecked,
        } as DialogWithSecondaryCheckboxResult
      : false;

    this.dialogRef.close(result);
  }

  onSubmit(): void {
    const result = this.withSecondaryCheckbox
      ? {
          confirmed: true,
          secondaryCheckbox: this.isSecondaryCheckboxChecked,
        } as DialogWithSecondaryCheckboxResult
      : true;

    this.dialogRef.close(result);
  }

  private get withSecondaryCheckbox(): boolean {
    return 'secondaryCheckbox' in this.options;
  }
}
