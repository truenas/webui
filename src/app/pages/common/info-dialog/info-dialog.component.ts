import { MatDialog, MatDialogRef } from '@angular/material';
import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { T } from '../../../translate-marker';

@Component({
  selector: 'info-dialog',
  templateUrl: './info-dialog.component.html',
  styleUrls : [ './info-dialog.component.scss' ]
})
export class InfoDialog {

  public title: string;
  public info: string;
  public buttonMsg: string = T("Close");


  constructor(public dialogRef: MatDialogRef < InfoDialog >, protected translate: TranslateService ) {
    
  }


}
