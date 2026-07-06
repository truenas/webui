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
  selector: 'ix-key-created-dialog',
  templateUrl: './key-created-dialog.component.html',
  styleUrls: ['./key-created-dialog.component.scss'],
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
export class KeyCreatedDialog {
  protected dialogRef = inject<DialogRef<unknown, KeyCreatedDialog>>(DialogRef);
  private clipboard = inject(Clipboard);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);

  key = signal(inject<string>(DIALOG_DATA));
  apiKeyControl = new FormControl<string>(this.key());

  onCopyPressed(): void {
    const copied = this.clipboard.copy(this.key());
    if (copied) {
      this.snackbar.success(this.translate.instant('API Key copied to clipboard'));
    }
  }
}
