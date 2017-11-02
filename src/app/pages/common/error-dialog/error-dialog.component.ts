import {MdDialog, MdDialogRef} from '@angular/material';
import { Component } from '@angular/core';

@Component({
  selector: 'error-dialog',
  templateUrl: './error-dialog.component.html',
  styleUrls : [ './error-dialog.component.scss' ]
})
export class ErrorDialog {

  public title: string;
  public message: string;
  public backtrace: string;
  public isCloseMoreInfo: Boolean = true;

  constructor(public dialogRef: MdDialogRef < ErrorDialog > ) {
    
  }

  public toggleOpen (data) {
    this.isCloseMoreInfo = !this.isCloseMoreInfo;
  }

}
