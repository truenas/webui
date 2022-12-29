import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Pool } from 'app/interfaces/pool.interface';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import {
  ManageUnusedDiskDialogComponent,
} from 'app/pages/storage/components/unused-resources/unused-disk-card/manage-unused-disk-dialog/manage-unused-disk-dialog.component';

@Component({
  selector: 'ix-unused-disk-card',
  templateUrl: './unused-disk-card.component.html',
  styleUrls: ['./unused-disk-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnusedDiskCardComponent {
  @Input() pools: Pool[];
  @Input() unusedDisks: UnusedDisk[];

  constructor(
    private matDialog: MatDialog,
  ) {}

  onAddToStorage(): void {
    this.matDialog.open(ManageUnusedDiskDialogComponent, {
      data: {
        pools: this.pools,
        unusedDisks: this.unusedDisks,
      },
      width: '600px',
    });
  }
}
