import { Clipboard } from '@angular/cdk/clipboard';
import { TnDialogShellComponent } from '@truenas/ui-components';
import {
  ChangeDetectionStrategy, Component, inject, signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { DIALOG_DATA } from '@angular/cdk/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-one-time-password-created-dialog',
  templateUrl: './one-time-password-created-dialog.component.html',
  styleUrls: ['./one-time-password-created-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
ReactiveFormsModule,
    FormActionsComponent,
    MatButton,
    TestDirective,
    TranslateModule,
    IxTextareaComponent,
  ],
})
export class OneTimePasswordCreatedDialog {
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
