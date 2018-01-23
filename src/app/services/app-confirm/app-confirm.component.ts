import { MatDialogRef } from '@angular/material';
import { Component } from '@angular/core';

@Component({
  selector: 'app-confirm',
  template: `<h1 mat-dialog-title>{{ title }}</h1>
    <div mat-dialog-content>{{ message }}</div>
    <div mat-dialog-actions>
    <button 
    type="button" 
    mat-raised-button
    color="primary" 
    (click)="dialogRef.close(true)">OK</button>
    &nbsp;
    <span fxFlex></span>
    <button 
    type="button"
    color="accent"
    mat-raised-button 
    (click)="dialogRef.close(false)">Cancel</button>
    </div>`,
})
export class AppComfirmComponent {

  public title: string;
  public message: string;

  constructor(public dialogRef: MatDialogRef<AppComfirmComponent>) {

  }
}