import { Clipboard } from '@angular/cdk/clipboard';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy, Component, inject, signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnButtonComponent, TnDialogShellComponent, TnFormFieldComponent, TnInputComponent,
} from '@truenas/ui-components';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';

@Component({
  selector: 'ix-one-time-password-created-dialog',
  templateUrl: './one-time-password-created-dialog.component.html',
  styleUrls: ['./one-time-password-created-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    ReactiveFormsModule,
    FormActionsComponent,
    TnButtonComponent,
    TranslateModule,
    TnFormFieldComponent,
    TnInputComponent,
  ],
})
export class OneTimePasswordCreatedDialog {
  protected dialogRef = inject<DialogRef<unknown, OneTimePasswordCreatedDialog>>(DialogRef);
  private clipboard = inject(Clipboard);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);

  password = signal(inject<string>(DIALOG_DATA));
  passwordControl = new FormControl<string>(this.password());

  onCopyPressed(): void {
    const copied = this.clipboard.copy(this.password());
    if (copied) {
      this.snackbar.success(this.translate.instant('One-Time Password copied to clipboard'));
    }
  }
}
