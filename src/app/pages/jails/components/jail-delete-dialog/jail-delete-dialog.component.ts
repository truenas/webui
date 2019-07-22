import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-jail-delete-dialog',
  templateUrl: './jail-delete-dialog.component.html'
})
export class JailDeleteDialogComponent {
  public isConfirmed = false;
  public deleteMessage = 'The jail will be deleted. Are you sure?';

  constructor(
    public dialogRef: MatDialogRef<JailDeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { jail: { host_hostuuid: string }; force: boolean }
  ) {}
}
