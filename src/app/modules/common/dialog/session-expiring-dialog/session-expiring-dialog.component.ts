import {
  ChangeDetectionStrategy,
  Component, Inject,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConfirmOptionsWithSecondaryCheckbox } from 'app/interfaces/dialog.interface';

@Component({
  selector: 'ix-session-expiring-dialog',
  templateUrl: './session-expiring-dialog.component.html',
  styleUrls: ['./session-expiring-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionExpiringDialogComponent {
  options: ConfirmOptionsWithSecondaryCheckbox;

  constructor(
    private dialogRef: MatDialogRef<SessionExpiringDialogComponent>,
    @Inject(MAT_DIALOG_DATA) options: ConfirmOptionsWithSecondaryCheckbox,
  ) {
    this.options = { ...options };
  }

  extendSession(): void {
    this.dialogRef.close(true);
  }

  viewSessionsCard(): void {
    this.extendSession();
  }
}
