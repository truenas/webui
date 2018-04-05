import { MatDialog, MatDialogRef } from '@angular/material';
import { Component } from '@angular/core';
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
  public buttonMsg: string = T("Ok");
  public hideCheckBox: boolean = false;
  public isSubmitEnabled: boolean = false;

  constructor(public dialogRef: MatDialogRef < ConfirmDialog >, protected translate: TranslateService ) {

  }

  toggleSubmit(data) {
    this.isSubmitEnabled = data.checked;
  }
}
