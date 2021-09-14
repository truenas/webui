import { Component, Output, EventEmitter } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import globalHelptext from 'app/helptext/global-helptext';
import { SystemGeneralService } from 'app/services/system-general.service';
import { T } from 'app/translate-marker';
import { EntityUtils } from '../entity/utils';

@UntilDestroy()
@Component({
  selector: 'app-password-dialog',
  templateUrl: './password-dialog.component.html',
  styleUrls: ['./password-dialog.component.scss'],
})
export class PasswordDialog {
  title: string = globalHelptext.rootpw.dialog_title;
  message: string;
  placeholder = globalHelptext.rootpw.placeholder;
  buttonMsg: string = T('Continue');
  cancelMsg: string = T('Cancel');
  hideCheckBox = false;
  method: string;
  data: string;
  tooltip = globalHelptext.rootpw.tooltip;
  hideCancel = false;
  customSubmit: any;
  showPassword = false;
  inputType = 'password';
  errors = '';
  password = '';

  @Output() switchSelectionEmitter = new EventEmitter<any>();

  constructor(
    public dialogRef: MatDialogRef<PasswordDialog>,
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
        new EntityUtils().handleWSError(this, err);
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
