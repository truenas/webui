import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';
import { helptextVmList } from 'app/helptext/vm/vm-list';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';

export interface StopVmDialogData {
  wasStopped: boolean;
  forceAfterTimeout: boolean;
}

@UntilDestroy()
@Component({
  templateUrl: './stop-vm-dialog.component.html',
  styleUrls: ['./stop-vm-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StopVmDialogComponent {
  forceAfterTimeoutCheckbox = new FormControl(false);

  readonly helptext = helptextVmList;

  constructor(
    private dialogRef: MatDialogRef<StopVmDialogComponent, StopVmDialogData>,
    @Inject(MAT_DIALOG_DATA) public vm: VirtualMachine,
  ) { }

  onStop(): void {
    this.dialogRef.close({
      wasStopped: true,
      forceAfterTimeout: this.forceAfterTimeoutCheckbox.value,
    });
  }
}
