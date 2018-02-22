import { MatDialog, MatDialogRef } from '@angular/material';
import { Component } from '@angular/core';
import { TranslateService } from 'ng2-translate/ng2-translate';

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

  constructor(public dialogRef: MatDialogRef < ErrorDialog >, public translate: TranslateService ) {
    
  }

  public toggleOpen (data) {
    this.isCloseMoreInfo = !this.isCloseMoreInfo;
  }

}
