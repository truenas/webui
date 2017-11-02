import {MdDialog, MdDialogRef} from '@angular/material';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';

@Component({
  selector: 'modal-dialog',
  templateUrl: './modal-dialog.component.html',
  styleUrls : [ './modal-dialog.component.css' ]
})
export class ModalDialog {

  public title: string;


  constructor(public dialogRef: MdDialogRef < ModalDialog >) {}
}
