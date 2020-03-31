import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'truecommand-status',
    templateUrl: './truecommand.component.html',
    styleUrls: ['./truecommand.component.css']
})
export class TruecommandComponent {
  public parent = this.data.parent;
  public tc = this.data.data;

  constructor(
    public dialogRef: MatDialogRef<TruecommandComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public translate: TranslateService) {}

    gotoTC() {
      window.open(this.tc.remote_address);
    }
}