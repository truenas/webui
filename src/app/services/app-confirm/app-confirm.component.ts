import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm',
  templateUrl: './app-confirm.component.html',
})
export class AppConfirmComponent {
  title: string;
  message: string;
  customButton: string;

  constructor(public dialogRef: MatDialogRef<AppConfirmComponent>) {

  }
}
