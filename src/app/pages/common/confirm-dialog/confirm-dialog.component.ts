import {MdDialog, MdDialogRef} from '@angular/material';
import { Component } from '@angular/core';

@Component({
  selector: 'confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
})
export class ConfirmDialog {

  public title: string;
  public message: string;

  constructor(public dialogRef: MdDialogRef < ConfirmDialog > ) {

  }
}
