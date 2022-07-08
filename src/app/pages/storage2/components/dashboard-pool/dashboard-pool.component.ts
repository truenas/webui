import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { EMPTY } from 'rxjs';
import {
  catchError, filter, switchMap, tap,
} from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import helptext from 'app/helptext/storage/volumes/volume-list';
import { Dataset } from 'app/interfaces/dataset.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { VolumeData, VolumesData } from 'app/interfaces/volume-data.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  ExportDisconnectModalComponent,
} from 'app/pages/storage2/components/dashboard-pool/export-disconnect-modal/export-disconnect-modal.component';
import { AppLoaderService, DialogService, WebSocketService } from 'app/services';

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
    private dialogService: DialogService,
    private translate: TranslateService,
    private loader: AppLoaderService,
    private ws: WebSocketService,
    private snackbar: SnackbarService,
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

  onExpand(): void {
    this.dialogService.confirm({
      title: this.translate.instant(helptext.expand_pool_dialog.title),
      message: this.translate.instant(helptext.expand_pool_dialog.message),
    })
      .pipe(
        filter(Boolean),
        switchMap(() => {
          this.loader.open();
          return this.ws.job('pool.expand', [this.pool.id]);
        }),
        filter((job) => job.state === JobState.Success),
        tap(() => {
          this.loader.close();
          this.snackbar.success(
            this.translate.instant('Successfully expanded pool {name}.', { name: this.pool.name }),
          );
          this.poolsUpdated.emit();
        }),
        catchError((error) => {
          this.loader.close();
          new EntityUtils().handleWsError(this, error, this.dialogService);
          return EMPTY;
        }),
        untilDestroyed(this),
      )
      .subscribe();
  }

  onUpgrade(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Upgrade Pool'),
      message: this.translate.instant(helptext.upgradePoolDialog_warning) + this.pool.name,
    }).pipe(
      filter(Boolean),
      switchMap(() => {
        this.loader.open();
        return this.ws.call('pool.upgrade', [this.pool.id]);
      }),
      tap(() => {
        this.loader.close();
        this.snackbar.success(
          this.translate.instant('Pool {name} successfully upgraded.', { name: this.pool.name }),
        );
        this.poolsUpdated.emit();
      }),
      catchError((error) => {
        this.loader.close();
        new EntityUtils().handleWsError(this, error, this.dialogService);
        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe();
  }
}
