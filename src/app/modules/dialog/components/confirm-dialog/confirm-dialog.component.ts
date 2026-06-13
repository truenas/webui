import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnCheckboxComponent, TnCheckboxLabelDirective, TnDialogShellComponent } from '@truenas/ui-components';
import {
  ConfirmOptions, ConfirmOptionsWithSecondaryCheckbox, DialogWithSecondaryCheckboxResult,
} from 'app/interfaces/dialog.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';

type ConfirmDialogResult = boolean | DialogWithSecondaryCheckboxResult;

@Component({
  selector: 'ix-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    TnButtonComponent,
    TnCheckboxComponent,
    TnCheckboxLabelDirective,
    ReactiveFormsModule,
    FormsModule,
    FormActionsComponent,
    TranslateModule,
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

  toggleSubmit(checked: boolean): void {
    this.isSubmitEnabled = checked;
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
    // A not-confirmed result carries no meaningful checkbox state, so report
    // `secondaryCheckbox: false`. This matches the ESC/backdrop dismiss path
    // (DialogService.confirm normalizes a dismiss to the same shape), so Cancel
    // and dismiss produce an identical "not confirmed" result and no caller can
    // accidentally read a stale checkbox value off a cancelled dialog.
    const result: ConfirmDialogResult = this.withSecondaryCheckbox
      ? {
          confirmed: false,
          secondaryCheckbox: false,
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
