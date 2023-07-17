import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface StartServiceDialogResult {
  start: boolean;
  startAutomatically: boolean;
}

// TODO: There is similar logic that starts a service in various components. Consider extracting here.
@Component({
  templateUrl: './start-service-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StartServiceDialogComponent {
  startAutomaticallyControl = new FormControl(false);

  constructor(
    @Inject(MAT_DIALOG_DATA) public serviceName: string,
    private dialogRef: MatDialogRef<StartServiceDialogComponent, StartServiceDialogResult>,
  ) {}

  onCancel(): void {
    this.dialogRef.close({
      start: false,
      startAutomatically: false,
    });
  }

  onEnable(): void {
    this.dialogRef.close({
      start: true,
      startAutomatically: this.startAutomaticallyControl.value,
    });
  }
}
