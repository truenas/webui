import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Pool } from 'app/interfaces/pool.interface';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import {
  ManageUnassignedDiskDialogComponent,
} from 'app/pages/storage2/components/unassigned-disk/manage-unassigned-disk-dialog/manage-unassigned-disk-dialog.component';
import { WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-unassigned-disk',
  templateUrl: './unassigned-disk.component.html',
  styleUrls: ['./unassigned-disk.component.scss'],
})
export class UnassignedDiskComponent implements OnInit {
  @Input() pools: Pool[];
  unusedDisks: UnusedDisk[] = [];

  constructor(
    private ws: WebSocketService,
    private matDialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.ws.call('disk.get_unused').pipe(untilDestroyed(this)).subscribe((disks) => {
      this.unusedDisks = disks;
    });
  }

  onAddToStorage(): void {
    this.matDialog.open(ManageUnassignedDiskDialogComponent, {
      data: {
        pools: this.pools,
        unusedDisks: this.unusedDisks,
      },
    });
  }
}
