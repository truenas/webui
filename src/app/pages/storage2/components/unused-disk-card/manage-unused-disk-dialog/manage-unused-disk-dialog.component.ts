import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ManageUnusedDiskDialogResource } from './manage-unused-disk-dialog.interface';

@Component({
  templateUrl: './manage-unused-disk-dialog.component.html',
  styleUrls: ['./manage-unused-disk-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManageUnusedDiskDialogComponent {
  constructor(
    private router: Router,
    private dialogRef: MatDialogRef<ManageUnusedDiskDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public resource: ManageUnusedDiskDialogResource,
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
