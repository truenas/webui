import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  templateUrl: './full-screen-dialog.component.html',
  styleUrls: ['./full-screen-dialog.component.scss'],
})
export class FullScreenDialogComponent {
  title: string;
  message: string;

  constructor(
    public dialogRef: MatDialogRef<FullScreenDialogComponent>,
    @Inject(MAT_DIALOG_DATA) protected data: { showClose: boolean },
  ) {}

  close(): void {
    this.dialogRef.close();
  }
}
