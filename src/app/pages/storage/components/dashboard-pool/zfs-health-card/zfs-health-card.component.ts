import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { formatDuration } from 'date-fns';
import { EMPTY, Observable } from 'rxjs';
import {
  catchError, filter, map, switchMap,
} from 'rxjs/operators';
import { PoolScanFunction } from 'app/enums/pool-scan-function.enum';
import { PoolScanState } from 'app/enums/pool-scan-state.enum';
import { PoolScrubAction } from 'app/enums/pool-scrub-action.enum';
import { getPoolStatusLabels, PoolStatus } from 'app/enums/pool-status.enum';
import { secondsToDuration } from 'app/helpers/time.helpters';
import { LoadingState, toLoadingState } from 'app/helpers/to-loading-state.helper';
import { Pool, PoolScanUpdate } from 'app/interfaces/pool.interface';
import { PoolScan } from 'app/interfaces/resilver-job.interface';
import { TopologyItem } from 'app/interfaces/storage.interface';
import {
  AutotrimDialogComponent,
} from 'app/pages/storage/components/dashboard-pool/zfs-health-card/autotrim-dialog/autotrim-dialog.component';
import { PoolsDashboardStore } from 'app/pages/storage/stores/pools-dashboard-store.service';
import { DialogService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-zfs-health-card',
  templateUrl: './zfs-health-card.component.html',
  styleUrls: ['./zfs-health-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZfsHealthCardComponent implements OnChanges, OnDestroy {
  @Input() pool: Pool;

  scan: PoolScanUpdate;
  totalZfsErrors = 0;
  poolScanSubscriptionId: string;

  hasScrubTask$: Observable<LoadingState<boolean>>;

  readonly poolStatusLabels = getPoolStatusLabels(this.translate);
  readonly PoolStatus = PoolStatus;

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private dialogService: DialogService,
    private dialog: MatDialog,
    private store: PoolsDashboardStore,
  ) { }

  get isScanRunning(): boolean {
    return this.scan?.state === PoolScanState.Scanning;
  }

  get isScanScrub(): boolean {
    return this.scan?.function === PoolScanFunction.Scrub;
  }

  get scanDuration(): string {
    if (!this.scan?.end_time?.$date || !this.scan?.start_time?.$date) {
      return '';
    }

    const seconds = secondsToDuration((this.scan.end_time.$date - this.scan.start_time.$date) / 1000);
    return formatDuration(seconds);
  }

  get timeLeftString(): string {
    const duration = secondsToDuration(this.scan.total_secs_left);
    return this.translate.instant('{duration} remaining', { duration: formatDuration(duration) });
  }

  get scanExplanation(): string {
    // Date is substituted in template because formatDatePipe loads timezone asynchronously.
    // TODO: Consider implementing a reactive service for localized time formatting.
    switch (this.scan.state) {
      case PoolScanState.Finished:
        return this.isScanScrub
          ? T('Finished Scrub on {date}')
          : T('Finished Resilver on {date}');
      case PoolScanState.Canceled:
        return this.isScanScrub
          ? T('Canceled Scrub on {date}')
          : T('Canceled Resilver on {date}');
    }
  }

  ngOnChanges(): void {
    this.scan = this.pool.scan;

    this.subscribeToScan();
    this.calculateTotalZfsErrors();
    this.loadScrubTaskStatus();
  }

  onStartScrub(): void {
    const message = this.translate.instant('Start scrub on pool <i>{poolName}</i>?', { poolName: this.pool.name });
    this.dialogService.confirm({
      message,
      title: this.translate.instant('Scrub Pool'),
      buttonMsg: this.translate.instant('Start Scrub'),
    })
      .pipe(
        filter(Boolean),
        switchMap(() => this.ws.call('pool.scrub', [this.pool.id, PoolScrubAction.Start])),
        catchError((error) => {
          this.dialogService.errorReportMiddleware(error);
          return EMPTY;
        }),
        untilDestroyed(this),
      )
      .subscribe();
  }

  onStopScrub(): void {
    const message = this.translate.instant('Stop the scrub on {poolName}?', { poolName: this.pool.name });
    this.dialogService.confirm({
      message,
      title: this.translate.instant('Scrub Pool'),
      buttonMsg: this.translate.instant('Stop Scrub'),
    }).pipe(
      filter(Boolean),
      switchMap(() => this.ws.call('pool.scrub', [this.pool.id, PoolScrubAction.Stop])),
      catchError((error) => {
        this.dialogService.errorReportMiddleware(error);
        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  onEditAutotrim(): void {
    this.dialog
      .open(AutotrimDialogComponent, { data: this.pool })
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.store.loadDashboard());
  }

  ngOnDestroy(): void {
    this.unsubscribeFromScan();
  }

  private subscribeToScan(): void {
    this.unsubscribeFromScan();
    this.poolScanSubscriptionId = `zfs.pool.scan - ${this.pool.name}`;
    this.ws.sub<PoolScan>('zfs.pool.scan', this.poolScanSubscriptionId)
      .pipe(
        filter((scan) => scan.name === this.pool.name),
        untilDestroyed(this),
      )
      .subscribe({
        next: (scan) => {
          this.scan = scan.scan;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.dialogService.errorReportMiddleware(error);
        },
      });
  }

  private loadScrubTaskStatus(): void {
    this.hasScrubTask$ = this.ws.call('pool.scrub.query', [[['pool_name', '=', this.pool.name]]]).pipe(
      map((scrubTasks) => scrubTasks.length > 0),
      toLoadingState(),
    );
  }

  private calculateTotalZfsErrors(): void {
    if (!this.pool.topology) {
      return;
    }
    this.totalZfsErrors = Object.values(this.pool.topology).reduce((errors: number, vdevs: TopologyItem[]) => {
      return errors + vdevs.reduce((errors, vdev) => {
        return errors
          + (vdev.stats?.read_errors || 0)
          + (vdev.stats?.write_errors || 0)
          + (vdev.stats?.checksum_errors || 0);
      }, 0);
    }, 0);
  }

  private unsubscribeFromScan(): void {
    if (!this.poolScanSubscriptionId) {
      return;
    }

    this.ws.unsub('zfs.pool.scan', this.poolScanSubscriptionId);
  }
}
