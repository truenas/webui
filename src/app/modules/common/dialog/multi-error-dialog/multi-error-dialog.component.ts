import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ErrorReport } from 'app/interfaces/error-report.interface';

@Component({
  templateUrl: './multi-error-dialog.component.html',
  styleUrls: ['./multi-error-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MultiErrorDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<MultiErrorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public errors: ErrorReport[],
  ) {}
}
