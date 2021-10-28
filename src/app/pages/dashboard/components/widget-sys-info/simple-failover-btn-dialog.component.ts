import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';
import { helptext_system_failover } from 'app/helptext/system/failover';

interface DialogData {
  agreed: boolean;
}

@UntilDestroy()
@Component({
  selector: 'simple-failover-btn-dialog',
  templateUrl: './simple-failover-btn-dialog.component.html',
  styleUrls: ['./simple-failover-btn.component.scss'],
})
export class SimpleFailoverBtnDialogComponent {
  private _confirmed: boolean;
  get confirmed(): boolean {
    return this._confirmed;
  }

  set confirmed(v) {
    this._confirmed = v;
    this.isDisabled = !v;
  }

  isDisabled = true;
  title = helptext_system_failover.dialog_initiate_failover_title;
  msg1 = helptext_system_failover.dialog_initiate_failover_message;
  checkbox = helptext_system_failover.dialog_initiate_failover_checkbox;
  cancel = helptext_system_failover.dialog_initiate_cancel;
  action = helptext_system_failover.dialog_initiate_action;

  constructor(
    public dialogRef: MatDialogRef<SimpleFailoverBtnDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
