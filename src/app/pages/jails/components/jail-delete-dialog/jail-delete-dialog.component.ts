import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import helptext from './../../../../helptext/jails/storage';

@Component({
  selector: 'app-jail-delete-dialog',
  templateUrl: './jail-delete-dialog.component.html'
})
export class JailDeleteDialogComponent {
  public isConfirmed = false;
  public deleteMessage = `Delete jail <b>${this.data.jail.host_hostuuid}</b>?`;
  public forceTooltip = helptext.jail_force_delete_tooltip;

  constructor(
    public dialogRef: MatDialogRef<JailDeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { jail: { host_hostuuid: string }; force: boolean }
  ) {}
}
