import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Dataset } from 'app/interfaces/dataset.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { VolumeData, VolumesData } from 'app/interfaces/volume-data.interface';
import {
  ExportDisconnectModalComponent,
} from 'app/pages/storage2/components/dashboard-pool/export-disconnect-modal/export-disconnect-modal.component';
import { WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-dashboard-pool',
  templateUrl: './dashboard-pool.component.html',
  styleUrls: ['./dashboard-pool.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPoolComponent implements OnInit {
  @Input() pool: Pool;

  @Output() poolsUpdated = new EventEmitter<void>();

  volumeData: VolumeData;
  isVolumeDataLoading = false;

  constructor(
    private matDialog: MatDialog,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadVolumeData();
  }

  loadVolumeData(): void {
    this.isVolumeDataLoading = true;
    this.ws.call('pool.dataset.query', [[], { extra: { retrieve_children: false } }]).pipe(untilDestroyed(this))
      .subscribe((datasets: Dataset[]) => {
        const vd: VolumesData = {};

        datasets.forEach((dataset) => {
          if (typeof dataset === undefined || !dataset) { return; }
          const usedPercent = dataset.used.parsed / (dataset.used.parsed + dataset.available.parsed);
          const zvol = {
            avail: dataset.available.parsed,
            id: dataset.id,
            name: dataset.name,
            used: dataset.used.parsed,
            used_pct: (usedPercent * 100).toFixed(0) + '%',
          };
          vd[zvol.id] = zvol;
        });
        this.volumeData = vd[this.pool.name];
        this.isVolumeDataLoading = false;
        this.cdr.detectChanges();
        this.cdr.markForCheck();
      });
  }

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
