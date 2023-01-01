import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  templateUrl: './exported-pools-dialog.component.html',
})
export class ExportedPoolsDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { disks: { diskName: string; exportedPool: string }[] },
  ) { }
}
