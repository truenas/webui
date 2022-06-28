import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, Output,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Pool } from 'app/interfaces/pool.interface';
import {
  ExportDisconnectModalComponent,
} from 'app/pages/storage2/components/dashboard-pool/export-disconnect-modal/export-disconnect-modal.component';

@UntilDestroy()
@Component({
  selector: 'ix-dashboard-pool',
  templateUrl: './dashboard-pool.component.html',
  styleUrls: ['./dashboard-pool.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPoolComponent {
  @Input() pool: Pool;

  @Output() poolsUpdated = new EventEmitter<void>();

  constructor(
    private matDialog: MatDialog,
  ) {}

  onExport(): void {
    this.matDialog
      .open(ExportDisconnectModalComponent, {
        data: this.pool,
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((needRefresh: boolean) => {
        if (!needRefresh) {
          return;
        }

        this.poolsUpdated.emit();
      });
  }
}
