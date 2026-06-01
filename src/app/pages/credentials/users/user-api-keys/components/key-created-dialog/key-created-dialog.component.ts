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
  selector: 'ix-key-created-dialog',
  templateUrl: './key-created-dialog.component.html',
  styleUrls: ['./key-created-dialog.component.scss'],
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
export class KeyCreatedDialog {
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
