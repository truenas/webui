import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import helptext from './../../../../helptext/jails/storage';

@Component({
  selector: 'app-jail-delete-dialog',
  templateUrl: './jail-delete-dialog.component.html'
})
export class JailDeleteDialogComponent {
  public isConfirmed = false;
  public deleteMessage = helptext.jail_delete_message + ` <b>${this.data.jail.host_hostuuid}</b>?`;
  public forcePlaceholder = helptext.jail_force_delete_placeholder;
  public forceTooltip = helptext.jail_force_delete_tooltip;

  constructor(
    public dialogRef: MatDialogRef<JailDeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { jail: { host_hostuuid: string }; force: boolean }
  ) {}
}
