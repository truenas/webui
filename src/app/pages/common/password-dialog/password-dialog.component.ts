import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import globalHelptext from 'app/helptext/global-helptext';
import { SystemGeneralService } from 'app/services/system-general.service';
import { EntityUtils } from '../entity/utils';

@UntilDestroy()
@Component({
  selector: 'app-password-dialog',
  templateUrl: './password-dialog.component.html',
  styleUrls: ['./password-dialog.component.scss'],
})
export class PasswordDialogComponent {
  title: string = globalHelptext.rootpw.dialog_title;
  message: string;
  placeholder = globalHelptext.rootpw.placeholder;
  buttonMsg: string = this.translate.instant('Continue');
  cancelMsg: string = this.translate.instant('Cancel');
  hideCheckBox = false;
  method: string;
  data: string;
  tooltip = globalHelptext.rootpw.tooltip;
  hideCancel = false;
  showPassword = false;
  inputType = 'password';
  errors = '';
  password = '';

  constructor(
    public dialogRef: MatDialogRef<PasswordDialogComponent>,
    protected translate: TranslateService,
    protected sysGeneralService: SystemGeneralService,
  ) {}

  submit(): void {
    this.sysGeneralService.checkRootPW(this.password).pipe(untilDestroyed(this)).subscribe(
      (res) => {
        if (res) {
          this.dialogRef.close(true);
        } else {
          this.errors = globalHelptext.rootpw.error_msg;
        }
      },
      (err) => {
        new EntityUtils().handleWsError(this, err);
      },
    );
  }

  togglePW(): void {
    this.inputType = this.inputType === 'password' ? '' : 'password';
    this.showPassword = !this.showPassword;
  }

  isDisabled(): boolean {
    return this.password === '';
  }
}
