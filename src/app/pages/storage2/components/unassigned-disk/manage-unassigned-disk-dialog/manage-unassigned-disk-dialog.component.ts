import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ManageUnassignedDiskDialogResource } from './manage-unassigned-disk-dialog.interface';

@Component({
  templateUrl: './manage-unassigned-disk-dialog.component.html',
  styleUrls: ['./manage-unassigned-disk-dialog.component.scss'],
})
export class ManageUnassignedDiskDialogComponent {
  constructor(
    private router: Router,
    private dialogRef: MatDialogRef<ManageUnassignedDiskDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public resource: ManageUnassignedDiskDialogResource,
  ) { }

  onAddDisk(poolId: number): void {
    this.dialogRef.close();
    this.router.navigate(['/', 'storage', 'manager', poolId]);
  }

  onCreatePool(): void {
    this.dialogRef.close();
    this.router.navigate(['/', 'storage', 'manager']);
  }
}
