import { Clipboard } from '@angular/cdk/clipboard';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnBannerComponent, TnButtonComponent, TnDialogShellComponent, TnFormFieldComponent, TnInputComponent,
} from '@truenas/ui-components';
import { S3AccessKey } from 'app/interfaces/s3.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TranslatedString } from 'app/modules/translate/translate.helper';

/**
 * Shows an access key pair after it is created or rotated.
 */
@Component({
  selector: 'ix-s3-access-key-credentials-dialog',
  templateUrl: './s3-access-key-credentials-dialog.component.html',
  styleUrls: ['./s3-access-key-credentials-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    ReactiveFormsModule,
    FormActionsComponent,
    TnBannerComponent,
    TnButtonComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TranslateModule,
  ],
})
export class S3AccessKeyCredentialsDialogComponent {
  protected dialogRef = inject<DialogRef<unknown, S3AccessKeyCredentialsDialogComponent>>(DialogRef);
  private clipboard = inject(Clipboard);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);

  protected readonly accessKey = inject<S3AccessKey>(DIALOG_DATA);

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
