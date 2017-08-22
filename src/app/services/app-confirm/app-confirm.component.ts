import { MdDialogRef } from '@angular/material';
import { Component } from '@angular/core';

@Component({
  selector: 'app-confirm',
  template: `<h1 md-dialog-title>{{ title }}</h1>
    <div md-dialog-content>{{ message }}</div>
    <div md-dialog-actions>
    <button 
    type="button" 
    md-raised-button
    color="primary" 
    (click)="dialogRef.close(true)">OK</button>
    &nbsp;
    <span fxFlex></span>
    <button 
    type="button"
    color="accent"
    md-raised-button 
    (click)="dialogRef.close(false)">Cancel</button>
    </div>`,
})
export class AppComfirmComponent {

  public title: string;
  public message: string;

  constructor(public dialogRef: MdDialogRef<AppComfirmComponent>) {

  }
}