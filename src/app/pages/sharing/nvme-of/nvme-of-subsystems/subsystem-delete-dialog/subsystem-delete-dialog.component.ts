import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'ix-subsystem-delete-dialog',
  templateUrl: './subsystem-delete-dialog.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubsystemDeleteDialogComponent {
  protected readonly force = new FormControl(false as boolean);

  constructor(
    private dialogRef: MatDialogRef<SubsystemDeleteDialogComponent>,
  ) {}

  protected delete(): void {
    this.dialogRef.close();
  }
}
