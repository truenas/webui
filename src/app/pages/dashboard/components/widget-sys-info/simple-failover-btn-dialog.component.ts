import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';
import { helptextSystemFailover } from 'app/helptext/system/failover';

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

  set confirmed(isConfirmed) {
    this._confirmed = isConfirmed;
    this.isDisabled = !isConfirmed;
  }

  isDisabled = true;
  title = helptextSystemFailover.dialog_initiate_failover_title;
  msg1 = helptextSystemFailover.dialog_initiate_failover_message;
  checkbox = helptextSystemFailover.dialog_initiate_failover_checkbox;
  cancel = helptextSystemFailover.dialog_initiate_cancel;
  action = helptextSystemFailover.dialog_initiate_action;

  constructor(
    public dialogRef: MatDialogRef<SimpleFailoverBtnDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
