import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'ix-full-screen-dialog',
  templateUrl: './full-screen-dialog.component.html',
  styleUrls: ['./full-screen-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FullScreenDialogComponent {
  title: string;
  message: string;

  constructor(
    public dialogRef: MatDialogRef<FullScreenDialogComponent>,
    @Inject(MAT_DIALOG_DATA) protected data: {
      showClose: boolean;
      pre: boolean;
    },
  ) {}

  close(): void {
    this.dialogRef.close(true);
  }
}
