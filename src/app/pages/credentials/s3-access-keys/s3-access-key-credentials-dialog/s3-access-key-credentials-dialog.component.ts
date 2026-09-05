import { Clipboard } from '@angular/cdk/clipboard';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle,
} from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { S3AccessKey } from 'app/interfaces/s3.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TranslatedString } from 'app/modules/translate/translate.helper';

/**
 * Shows an access key pair after it is created, rotated or on request.
 */
@Component({
  selector: 'ix-s3-access-key-credentials-dialog',
  templateUrl: './s3-access-key-credentials-dialog.component.html',
  styleUrls: ['./s3-access-key-credentials-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatButton,
    FormActionsComponent,
    IxInputComponent,
    TnIconComponent,
    TestDirective,
    TranslateModule,
  ],
})
export class S3AccessKeyCredentialsDialogComponent {
  private clipboard = inject(Clipboard);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);

  protected readonly accessKey = inject<S3AccessKey>(MAT_DIALOG_DATA);

  protected readonly accessKeyIdControl = new FormControl(this.accessKey.access_key);
  protected readonly secretControl = new FormControl(this.accessKey.secret ?? '');

  protected copyAccessKeyId(): void {
    this.copy(this.accessKey.access_key, this.translate.instant('Access key ID copied to clipboard'));
  }

  protected copySecret(): void {
    if (!this.accessKey.secret) {
      return;
    }
    this.copy(this.accessKey.secret, this.translate.instant('Secret access key copied to clipboard'));
  }

  private copy(text: string, message: TranslatedString): void {
    if (this.clipboard.copy(text)) {
      this.snackbar.success(message);
    }
  }
}
