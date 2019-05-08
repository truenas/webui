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
    const content = document.getElementById('md-content');
    const btPanel = document.getElementById('bt-panel');
    const txtarea = document.getElementById('bt-text');
    this.isCloseMoreInfo = !this.isCloseMoreInfo;
    if (!this.isCloseMoreInfo) {
      dialog[dialog.length-1].setAttribute('style','width : 800px; height: 600px');
      content.setAttribute('style', 'min-height: 450px')
      btPanel.setAttribute('style', 'width: 750px; max-height: 400px');
      txtarea.setAttribute('style', 'height: 400px')
    } else {
      dialog[dialog.length-1].removeAttribute('style');
      content.removeAttribute('style');
      btPanel.removeAttribute('style');
    }
  }

}
