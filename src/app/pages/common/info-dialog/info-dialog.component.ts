import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'info-dialog',
  templateUrl: './info-dialog.component.html',
  styleUrls: ['./info-dialog.component.scss'],
})
export class InfoDialog {
  title: string;
  info: string;
  icon: string;
  is_html: boolean;

  constructor(public dialogRef: MatDialogRef < InfoDialog >, protected translate: TranslateService) {

  }
}
