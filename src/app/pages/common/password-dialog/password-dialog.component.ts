import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Component, Output, EventEmitter} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SystemGeneralService } from '../../../services/system-general.service';
import globalHelptext from '../../../helptext/global-helptext';
import { T } from '../../../translate-marker';
import { EntityUtils } from '../../common/entity/utils';

@Component({
  selector: 'password-dialog',
  templateUrl: './password-dialog.component.html',
  styleUrls : [ './password-dialog.component.css' ]
})
export class PasswordDialog {

  public title: string = globalHelptext.rootpw.dialog_title;
  public message: string;
  public placeholder = globalHelptext.rootpw.placeholder;
  public buttonMsg: string = T("Continue");
  public cancelMsg: string = T('Cancel');
  public hideCheckBox = false;
  public isSubmitEnabled = false;
  public method: string;
  public data: string;
  public tooltip = globalHelptext.rootpw.tooltip;
  public hideCancel = false;
  public customSumbit;
  public showPassword = false;
  public inputType = 'password';
  public errors = '';
  public password = '';

  @Output() switchSelectionEmitter = new EventEmitter<any>();

  constructor(public dialogRef: MatDialogRef < PasswordDialog >, protected translate: TranslateService, 
              protected sysGeneralService: SystemGeneralService) {
  }

  onChangeEvent(event) {
    this.password = event.target.value;
    if (this.password !== '') {
      this.isSubmitEnabled = true;
    }
  }
  submit() {
    this.sysGeneralService.checkRootPW(this.password).subscribe(res => {
      if (res) {
        this.dialogRef.close(true);
      } else {
        this.isSubmitEnabled = false;
        this.errors = globalHelptext.rootpw.error_msg;
      }
    }, err => {
      new EntityUtils().handleWSError(this, err);
    });
  }
  togglePW() {
    this.inputType = this.inputType === 'password' ? '' : 'password';
    this.showPassword = !this.showPassword;
  }
  isDisabled() {
    return !this.isSubmitEnabled;
  }
}
