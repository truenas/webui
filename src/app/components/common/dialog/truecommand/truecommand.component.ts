import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'truecommand-status',
    templateUrl: './truecommand.component.html',
    styleUrls: ['./truecommand.component.css']
})
export class TruecommandComponent {
    
  constructor(
    public dialogRef: MatDialogRef<TruecommandComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {}
}