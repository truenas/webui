import { Clipboard } from '@angular/cdk/clipboard';
import {
  ChangeDetectionStrategy, Component, inject, signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose,
} from '@angular/material/dialog';
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
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogTitle,
    MatDialogContent,
    FormActionsComponent,
    MatDialogActions,
    MatButton,
    TestDirective,
    MatDialogClose,
    TranslateModule,
    IxTextareaComponent,
  ],
})
export class OneTimePasswordCreatedDialogComponent {
  password = signal(inject<string>(MAT_DIALOG_DATA));
  passwordControl = new FormControl<string>(this.password());

  constructor(
    private clipboard: Clipboard,
    private snackbar: SnackbarService,
    private translate: TranslateService,
  ) {}

  onCopyPressed(): void {
    const copied = this.clipboard.copy(this.password());
    if (copied) {
      this.snackbar.success(this.translate.instant('One-Time Password copied to clipboard'));
    }
  }
}
