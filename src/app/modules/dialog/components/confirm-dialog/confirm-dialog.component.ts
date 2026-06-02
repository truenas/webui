import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatCheckboxChange, MatCheckbox } from '@angular/material/checkbox';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnDialogShellComponent } from '@truenas/ui-components';
import {
  ConfirmOptions, ConfirmOptionsWithSecondaryCheckbox, DialogWithSecondaryCheckboxResult,
} from 'app/interfaces/dialog.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

type ConfirmDialogResult = boolean | DialogWithSecondaryCheckboxResult;

@Component({
  selector: 'ix-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    TnButtonComponent,
    MatCheckbox,
    ReactiveFormsModule,
    FormsModule,
    FormActionsComponent,
    TranslateModule,
    TestDirective,
  ],
})
export class ConfirmDialog {
  private dialogRef = inject<DialogRef<ConfirmDialogResult, ConfirmDialog>>(DialogRef);
  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);

  options: ConfirmOptionsWithSecondaryCheckbox;

  isSubmitEnabled = false;
  isSecondaryCheckboxChecked = false;

  private readonly defaultOptions = {
    title: this.translate.instant('Please confirm'),
    buttonText: this.translate.instant('Continue'),
    cancelText: this.translate.instant('Cancel'),
    hideCheckbox: false,
    confirmationCheckboxText: this.translate.instant('Confirm'),
  } as ConfirmOptions;

  constructor() {
    const options = inject<ConfirmOptionsWithSecondaryCheckbox>(DIALOG_DATA);

    this.options = { ...this.defaultOptions, ...options };
    // Only block dismissal when there is no Cancel button (the user must make an
    // explicit choice). Otherwise the dialog stays closable via ESC/backdrop —
    // a dismiss resolves to `false` (see DialogService.confirm), so callers
    // reading `.confirmed` are unaffected even with a secondary checkbox.
    if (options.hideCancel) {
      this.dialogRef.disableClose = options.hideCancel;
    }
  }

  toggleSubmit(data: MatCheckboxChange): void {
    this.isSubmitEnabled = data.checked;
  }

  onSecondaryCheckboxChange(): void {
    // Trigger change detection to show/hide the secondary message
    this.cdr.markForCheck();
  }

  isDisabled(): boolean {
    if (!this.options.hideCheckbox) {
      return !this.isSubmitEnabled && !this.options.hideCheckbox;
    }
    return false;
  }

  onCancel(): void {
    const result: ConfirmDialogResult = this.withSecondaryCheckbox
      ? {
          confirmed: false,
          secondaryCheckbox: this.isSecondaryCheckboxChecked,
        }
      : false;

    this.dialogRef.close(result);
  }

  onSubmit(): void {
    const result: ConfirmDialogResult = this.withSecondaryCheckbox
      ? {
          confirmed: true,
          secondaryCheckbox: this.isSecondaryCheckboxChecked,
        }
      : true;

    this.dialogRef.close(result);
  }

  private get withSecondaryCheckbox(): boolean {
    return 'secondaryCheckbox' in this.options;
  }
}
