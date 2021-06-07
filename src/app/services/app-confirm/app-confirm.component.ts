import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm',
  template: `<h1 mat-dialog-title>{{ title }}</h1>
    <div mat-dialog-content>{{ message }}</div>
    <div mat-dialog-actions style='justify-content:flex-end'>
    <button
    type="button"
    color="accent"
    mat-button
    (click)="dialogRef.close(false)">{{'Cancel'}}</button>
    <button
    type="button"
    mat-button
    color="primary"
    (click)="dialogRef.close(true)">{{customButton}}</button>
    </div>`,
})
export class AppComfirmComponent {
  title: string;
  message: string;
  customButton: string;

  constructor(public dialogRef: MatDialogRef<AppComfirmComponent>) {

  }
}
