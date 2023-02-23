import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';
import helptext from 'app/helptext/vm/vm-list';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';

@UntilDestroy()
@Component({
  templateUrl: './stop-vm-dialog.component.html',
  styleUrls: ['./stop-vm-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StopVmDialogComponent {
  forceAfterTimeoutCheckbox = new FormControl(false);

  readonly helptext = helptext;

  constructor(
    private dialogRef: MatDialogRef<StopVmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public vm: VirtualMachine,
  ) { }

  onStop(): void {
    this.dialogRef.close({ wasStopped: true, forceAfterTimeout: this.forceAfterTimeoutCheckbox.value });
  }
}
