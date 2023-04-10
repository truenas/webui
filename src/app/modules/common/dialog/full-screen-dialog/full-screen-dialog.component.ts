import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  templateUrl: './full-screen-dialog.component.html',
  styleUrls: ['./full-screen-dialog.component.scss'],
})
export class FullScreenDialogComponent {
  title: string;
  message: string;

  constructor(
    public dialogRef: MatDialogRef<FullScreenDialogComponent>,
  ) {}
}
