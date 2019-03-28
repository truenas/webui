import { MatDialog, MatDialogRef } from '@angular/material';
import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

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
    const dialogWrapper = document.getElementById('errordialog-wrapper');
    const dialog = document.getElementsByClassName('mat-dialog-container');
    const content = document.getElementsByClassName('mat-dialog-content');
    const btPanel = document.getElementsByClassName('backtrace-panel');
    const txtarea = document.getElementById('bt-text');
    this.isCloseMoreInfo = !this.isCloseMoreInfo;
    if (!this.isCloseMoreInfo) {
      dialog[0].setAttribute('style','width : 800px; height: 600px');
      content[0].setAttribute('style', 'min-height: 450px')
      btPanel[0].setAttribute('style', 'width: 750px; max-height: 400px');
      txtarea.setAttribute('style', 'min-height: 400px')
    } else {
      dialog[0].removeAttribute('style');
      content[0].removeAttribute('style');
      btPanel[0].removeAttribute('style');
    }
  }

}
