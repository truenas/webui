import { Clipboard } from '@angular/cdk/clipboard';
import { CdkScrollable } from '@angular/cdk/scrolling';
import {
  ChangeDetectionStrategy, Component, inject, signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose,
} from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-key-created-dialog',
  templateUrl: './key-created-dialog.component.html',
  styleUrls: ['./key-created-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogTitle,
    CdkScrollable,
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
export class KeyCreatedDialogComponent {
  key = signal(inject<string>(MAT_DIALOG_DATA));
  apiKeyControl = new FormControl<string>(this.key());

  constructor(
    private clipboard: Clipboard,
    private snackbar: SnackbarService,
  ) {}

  onCopyPressed(): void {
    const copied = this.clipboard.copy(this.key());
    if (copied) {
      this.snackbar.success('API Key copied to clipboard');
    }
  }
}
