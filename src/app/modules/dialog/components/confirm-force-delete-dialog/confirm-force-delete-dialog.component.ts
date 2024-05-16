import {
  ChangeDetectionStrategy, Component, Inject, signal,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Role } from 'app/enums/role.enum';
import { ConfirmForceDeleteDialogConfig, ConfirmForceDeleteDialogResponse } from 'app/interfaces/confirm-force-delete-dialog-config.interface';

@Component({
  selector: 'ix-confirm-force-delete-dialog',
  templateUrl: './confirm-force-delete-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmForceDeleteDialogComponent {
  protected requiredRoles = signal([Role.FullAdmin]);

  protected form = this.fb.group({
    force: [false],
  });

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ConfirmForceDeleteDialogResponse>,
    @Inject(MAT_DIALOG_DATA) protected data: ConfirmForceDeleteDialogConfig,
  ) {
    if (this.data.requiredRoles?.length) {
      this.requiredRoles.set(this.data.requiredRoles);
    }
  }

  onCancel(): void {
    this.dialogRef.close({
      confirmed: false,
    } as ConfirmForceDeleteDialogResponse);
  }

  onSubmit(): void {
    this.dialogRef.close({
      confirmed: true,
      force: this.form.controls.force.value,
    } as ConfirmForceDeleteDialogResponse);
  }
}
