import { MatDialog, MatDialogRef } from '@angular/material';
import { Component } from '@angular/core';
import { TranslateService } from 'ng2-translate/ng2-translate';

@Component({
  selector: 'info-dialog',
  templateUrl: './info-dialog.component.html',
  styleUrls : [ './info-dialog.component.scss' ]
})
export class InfoDialog {

  public title: string;
  public info: string;


  constructor(public dialogRef: MatDialogRef < InfoDialog >, protected translate: TranslateService ) {
    
  }


}
