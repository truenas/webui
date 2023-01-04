import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'ix-qr-dialog',
  templateUrl: './qr-dialog.component.html',
})
export class QrDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<QrDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { qrInfo: string },
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
