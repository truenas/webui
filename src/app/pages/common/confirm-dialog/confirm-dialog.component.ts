import { MatDialog, MatDialogRef } from '@angular/material';
import { Component } from '@angular/core';

@Component({
  selector: 'confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls : [ './confirm-dialog.component.css' ]
})
export class ConfirmDialog {

  public title: string;
  public message: string;
  public hideCheckBox: boolean = false;
  public isSubmitEnabled: boolean = false;

  constructor(public dialogRef: MatDialogRef < ConfirmDialog > ) {

  }

  toggleSubmit(data) {
    this.isSubmitEnabled = data.checked;
  }
}
