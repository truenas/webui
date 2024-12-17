import { DecimalPipe, PercentPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, input, OnChanges,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatCard, MatCardHeader, MatCardTitle, MatCardContent,
} from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressBar } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { formatDuration } from 'date-fns';
import { Observable, Subscription } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { PoolCardIconType } from 'app/enums/pool-card-icon-type.enum';
import { PoolScanFunction } from 'app/enums/pool-scan-function.enum';
import { PoolScanState } from 'app/enums/pool-scan-state.enum';
import { PoolScrubAction } from 'app/enums/pool-scrub-action.enum';
import { PoolStatus, poolStatusLabels } from 'app/enums/pool-status.enum';
import { Role } from 'app/enums/role.enum';
import { LoadingState, toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { secondsToDuration } from 'app/helpers/time.helpers';
import { Pool, PoolScanUpdate } from 'app/interfaces/pool.interface';
import { TopologyItem } from 'app/interfaces/storage.interface';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { PoolCardIconComponent } from 'app/pages/storage/components/dashboard-pool/pool-card-icon/pool-card-icon.component';
import {
  AutotrimDialogComponent,
} from 'app/pages/storage/components/dashboard-pool/zfs-health-card/autotrim-dialog/autotrim-dialog.component';
import {
  PruneDedupTableDialogComponent,
} from 'app/pages/storage/components/dashboard-pool/zfs-health-card/prune-dedup-table-dialog/prune-dedup-table-dialog.component';
import {
  SetDedupQuotaComponent,
} from 'app/pages/storage/components/dashboard-pool/zfs-health-card/set-dedup-quota/set-dedup-quota.component';
import { zfsHealthCardElements } from 'app/pages/storage/components/dashboard-pool/zfs-health-card/zfs-health-card.elements';
import { PoolsDashboardStore } from 'app/pages/storage/stores/pools-dashboard-store.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ApiService } from 'app/services/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-zfs-health-card',
  templateUrl: './zfs-health-card.component.html',
  styleUrls: ['./zfs-health-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    UiSearchDirective,
    MatCardHeader,
    MatCardTitle,
    PoolCardIconComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    MatCardContent,
    WithLoadingStateDirective,
    RouterLink,
    MatProgressBar,
    TranslateModule,
    FormatDateTimePipe,
    MapValuePipe,
    DecimalPipe,
    PercentPipe,
  ],
  providers: [FileSizePipe],
})
export class ZfsHealthCardComponent implements OnChanges {
  readonly pool = input.required<Pool>();

  protected readonly searchableElements = zfsHealthCardElements;

  scan: PoolScanUpdate;
  totalZfsErrors = 0;
  poolScanSubscription: Subscription;

  hasScrubTask$: Observable<LoadingState<boolean>>;

  readonly poolStatusLabels = poolStatusLabels;

  protected readonly requiredRoles = [Role.FullAdmin];

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    private matDialog: MatDialog,
    private store: PoolsDashboardStore,
    private fileSizePipe: FileSizePipe,
  ) { }

  deduplicationStats = computed(() => {
    if (this.pool().dedup_table_quota !== 'auto' && this.pool().dedup_table_quota !== '0') {
      const value = this.fileSizePipe.transform(this.pool().dedup_table_size);
      const quota = this.fileSizePipe.transform(parseInt(this.pool().dedup_table_quota, 10));
      return `${value} / ${quota}`;
    }

    return this.fileSizePipe.transform(this.pool().dedup_table_size);
  });

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
    try {
      const duration = secondsToDuration(this.scan.total_secs_left);
      return this.translate.instant('{duration} remaining', { duration: formatDuration(duration) });
    } catch {
      return ' - ';
    }
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

  protected iconType = computed(() => {
    if (!this.pool().healthy) {
      return PoolCardIconType.Error;
    }
    if (this.pool().status === PoolStatus.Degraded) {
      return PoolCardIconType.Warn;
    }
    if (this.pool().status === PoolStatus.Faulted) {
      return PoolCardIconType.Faulted;
    }
    return PoolCardIconType.Safe;
  });

  protected iconTooltip = computed(() => {
    if (!this.pool().healthy) {
      return this.translate.instant('Pool is not healthy');
    }
    if (this.pool().status === PoolStatus.Degraded) {
      return this.translate.instant('Pool status is {status}', { status: this.pool().status });
    }
    if (this.pool().status === PoolStatus.Faulted) {
      return this.translate.instant('Pool status is {status}', { status: this.pool().status });
    }
    return this.translate.instant('Everything is fine');
  });

  ngOnChanges(): void {
    this.scan = this.pool().scan;

    this.subscribeToScan();
    this.calculateTotalZfsErrors();
    this.loadScrubTaskStatus();
  }

  onStartScrub(): void {
    const message = this.translate.instant('Start scrub on pool <i>{poolName}</i>?', { poolName: this.pool().name });
    this.dialogService.confirm({
      message,
      title: this.translate.instant('Scrub Pool'),
      buttonText: this.translate.instant('Start Scrub'),
    })
      .pipe(
        filter(Boolean),
        switchMap(() => this.api.startJob('pool.scrub', [this.pool().id, PoolScrubAction.Start])),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe();
  }

  onStopScrub(): void {
    const message = this.translate.instant('Stop the scrub on {poolName}?', { poolName: this.pool().name });
    this.dialogService.confirm({
      message,
      title: this.translate.instant('Scrub Pool'),
      buttonText: this.translate.instant('Stop Scrub'),
    }).pipe(
      filter(Boolean),
      switchMap(() => this.api.startJob('pool.scrub', [this.pool().id, PoolScrubAction.Stop])),
      this.errorHandler.catchError(),
      untilDestroyed(this),
    ).subscribe();
  }

  onPauseScrub(): void {
    this.api.startJob('pool.scrub', [this.pool().id, PoolScrubAction.Pause])
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  onResumeScrub(): void {
    this.api.startJob('pool.scrub', [this.pool().id, PoolScrubAction.Start])
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  onEditAutotrim(): void {
    this.matDialog
      .open(AutotrimDialogComponent, { data: this.pool() })
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.store.loadDashboard());
  }

  onPruneDedupTable(): void {
    this.matDialog
      .open(PruneDedupTableDialogComponent, { data: this.pool() })
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.store.loadDashboard());
  }

  onSetDedupQuota(): void {
    this.matDialog
      .open(SetDedupQuotaComponent, { data: this.pool() })
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.store.loadDashboard());
  }

  private subscribeToScan(): void {
    if (this.poolScanSubscription && !this.poolScanSubscription.closed) {
      this.poolScanSubscription.unsubscribe();
    }
    this.poolScanSubscription = this.api.subscribe('zfs.pool.scan')
      .pipe(
        map((apiEvent) => apiEvent.fields),
        filter((scan) => scan.name === this.pool().name),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe((scan) => {
        this.scan = scan.scan;
        this.cdr.markForCheck();
      });
  }

  private loadScrubTaskStatus(): void {
    this.hasScrubTask$ = this.api.call('pool.scrub.query', [[['pool_name', '=', this.pool().name]]]).pipe(
      map((scrubTasks) => scrubTasks.length > 0),
      toLoadingState(),
    );
  }

  private calculateTotalZfsErrors(): void {
    if (!this.pool().topology) {
      return;
    }
    this.totalZfsErrors = Object.values(this.pool().topology).reduce((totalErrors: number, vdevs: TopologyItem[]) => {
      return totalErrors + vdevs.reduce((vdevCategoryErrors, vdev) => {
        return vdevCategoryErrors
          + (vdev.stats?.read_errors || 0)
          + (vdev.stats?.write_errors || 0)
          + (vdev.stats?.checksum_errors || 0);
      }, 0);
    }, 0);
  }
}
