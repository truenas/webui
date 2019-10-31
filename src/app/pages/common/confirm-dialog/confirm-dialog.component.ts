import { MatDialog, MatDialogRef } from '@angular/material';
import { Component, Output, EventEmitter} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { T } from '../../../translate-marker';

@Component({
  selector: 'confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls : [ './confirm-dialog.component.css' ]
})
export class ConfirmDialog {

  public title: string;
  public message: string;
  public buttonMsg: string = T("Continue");
  public cancelMsg: string = T('Cancel');
  public hideCheckBox = false;
  public isSubmitEnabled = false;
  public secondaryCheckBox = false;
  public secondaryCheckBoxMsg = '';
  public method: string;
  public data: string;
  public tooltip: string;
  public hideCancel = false;
  @Output() switchSelectionEmitter = new EventEmitter<any>();

  constructor(public dialogRef: MatDialogRef < ConfirmDialog >, protected translate: TranslateService ) {
  }

  toggleSubmit(data) {
    this.isSubmitEnabled = data.checked;
  }
  secondaryCheckBoxEvent(data){
    this.switchSelectionEmitter.emit(this.secondaryCheckBox);

  }
  isDisabled() {
    if (!this.hideCheckBox) {
      return !this.isSubmitEnabled && !this.hideCheckBox;
    }
    return this.secondaryCheckBox ? !this.isSubmitEnabled : false;
  }
}
