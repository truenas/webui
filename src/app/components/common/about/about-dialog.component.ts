import { MdDialog, MdDialogRef} from '@angular/material';
import { Component } from '@angular/core';

@Component({
  selector: 'about-dialog',
  styleUrls: ['./about-dialog.component.scss'],
  templateUrl: './about-dialog.component.html'
})
export class AboutModalDialog {

  constructor(
    public dialogRef: MdDialogRef<AboutModalDialog>) { }

}
