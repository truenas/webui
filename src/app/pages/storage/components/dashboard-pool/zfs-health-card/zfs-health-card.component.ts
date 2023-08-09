import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { formatDuration } from 'date-fns';
import { Observable, Subscription } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { PoolCardIconType } from 'app/enums/pool-card-icon-type.enum';
import { PoolScanFunction } from 'app/enums/pool-scan-function.enum';
import { PoolScanState } from 'app/enums/pool-scan-state.enum';
import { PoolScrubAction } from 'app/enums/pool-scrub-action.enum';
import { PoolStatus, poolStatusLabels } from 'app/enums/pool-status.enum';
import { LoadingState, toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { secondsToDuration } from 'app/helpers/time.helpers';
import { Pool, PoolScanUpdate } from 'app/interfaces/pool.interface';
import { TopologyItem } from 'app/interfaces/storage.interface';
import {
  AutotrimDialogComponent,
} from 'app/pages/storage/components/dashboard-pool/zfs-health-card/autotrim-dialog/autotrim-dialog.component';
import { PoolsDashboardStore } from 'app/pages/storage/stores/pools-dashboard-store.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-zfs-health-card',
  templateUrl: './zfs-health-card.component.html',
  styleUrls: ['./zfs-health-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZfsHealthCardComponent implements OnChanges {
  @Input() pool: Pool;

  scan: PoolScanUpdate;
  totalZfsErrors = 0;
  poolScanSubscription: Subscription;

  hasScrubTask$: Observable<LoadingState<boolean>>;

  readonly poolStatusLabels = poolStatusLabels;

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    private dialog: MatDialog,
    private store: PoolsDashboardStore,
  ) { }

  get scanLabel(): string {
    if (!this.isScrub) {
      return this.translate.instant('Resilvering:');
    }

    if (this.isScrubPaused) {
      return this.translate.instant('Scrub Paused');
    }

    return this.translate.instant('Scrub In Progress:');
  }

  get wasScanInitiated(): boolean {
    return this.scan?.state === PoolScanState.Scanning;
  }

  get isScrub(): boolean {
    return this.scan?.function === PoolScanFunction.Scrub;
  }

  get isScrubPaused(): boolean {
    return Boolean(this.scan?.pause);
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
        return this.isScrub
          ? T('Finished Scrub on {date}')
          : T('Finished Resilver on {date}');
      case PoolScanState.Canceled:
        return this.isScrub
          ? T('Canceled Scrub on {date}')
          : T('Canceled Resilver on {date}');
      default:
        return '';
    }
  }

  get iconType(): PoolCardIconType {
    if (!this.pool.healthy) {
      return PoolCardIconType.Error;
    }
    if (this.pool.status === PoolStatus.Degraded) {
      return PoolCardIconType.Warn;
    }
    if (this.pool.status === PoolStatus.Faulted) {
      return PoolCardIconType.Faulted;
    }
    return PoolCardIconType.Safe;
  }

  get iconTooltip(): string {
    if (!this.pool.healthy) {
      return this.translate.instant('Pool is not healthy');
    }
    if (this.pool.status === PoolStatus.Degraded) {
      return this.translate.instant('Pool status is {status}', { status: this.pool.status });
    }
    if (this.pool.status === PoolStatus.Faulted) {
      return this.translate.instant('Pool status is {status}', { status: this.pool.status });
    }
    return this.translate.instant('Everything is fine');
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
      buttonText: this.translate.instant('Start Scrub'),
    })
      .pipe(
        filter(Boolean),
        switchMap(() => this.ws.startJob('pool.scrub', [this.pool.id, PoolScrubAction.Start])),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe();
  }

  onStopScrub(): void {
    const message = this.translate.instant('Stop the scrub on {poolName}?', { poolName: this.pool.name });
    this.dialogService.confirm({
      message,
      title: this.translate.instant('Scrub Pool'),
      buttonText: this.translate.instant('Stop Scrub'),
    }).pipe(
      filter(Boolean),
      switchMap(() => this.ws.startJob('pool.scrub', [this.pool.id, PoolScrubAction.Stop])),
      this.errorHandler.catchError(),
      untilDestroyed(this),
    ).subscribe();
  }

  onPauseScrub(): void {
    this.ws.startJob('pool.scrub', [this.pool.id, PoolScrubAction.Pause])
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  onResumeScrub(): void {
    this.ws.startJob('pool.scrub', [this.pool.id, PoolScrubAction.Start])
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  onEditAutotrim(): void {
    this.dialog
      .open(AutotrimDialogComponent, { data: this.pool })
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.store.loadDashboard());
  }

  private subscribeToScan(): void {
    if (this.poolScanSubscription && !this.poolScanSubscription.closed) {
      this.poolScanSubscription.unsubscribe();
    }
    this.poolScanSubscription = this.ws.subscribe('zfs.pool.scan')
      .pipe(
        map((apiEvent) => apiEvent.fields),
        filter((scan) => scan.name === this.pool.name),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe((scan) => {
        this.scan = scan.scan;
        this.cdr.markForCheck();
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
    this.totalZfsErrors = Object.values(this.pool.topology).reduce((totalErrors: number, vdevs: TopologyItem[]) => {
      return totalErrors + vdevs.reduce((vdevCategoryErrors, vdev) => {
        return vdevCategoryErrors
          + (vdev.stats?.read_errors || 0)
          + (vdev.stats?.write_errors || 0)
          + (vdev.stats?.checksum_errors || 0);
      }, 0);
    }, 0);
  }
}
