import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, input, OnChanges, signal, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatCard, MatCardHeader, MatCardTitle, MatCardContent,
} from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { PoolCardIconType } from 'app/enums/pool-card-icon-type.enum';
import { PoolScanFunction } from 'app/enums/pool-scan-function.enum';
import { PoolScanState } from 'app/enums/pool-scan-state.enum';
import { PoolScrubAction } from 'app/enums/pool-scrub-action.enum';
import { PoolStatus, poolStatusLabels } from 'app/enums/pool-status.enum';
import { Role } from 'app/enums/role.enum';
import { helptextVolumes } from 'app/helptext/storage/volumes/volume-list';
import { Pool, PoolScanUpdate } from 'app/interfaces/pool.interface';
import { VDevItem } from 'app/interfaces/storage.interface';
import { ScheduleDescriptionPipe } from 'app/modules/dates/pipes/schedule-description/schedule-description.pipe';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  ScrubFormComponent,
} from 'app/pages/storage/components/dashboard-pool/disk-health-card/scrub-form/scrub-form.component';
import { PoolCardIconComponent } from 'app/pages/storage/components/dashboard-pool/pool-card-icon/pool-card-icon.component';
import {
  ActivePoolScanComponent,
} from 'app/pages/storage/components/dashboard-pool/storage-health-card/active-pool-scan/active-pool-scan.component';
import {
  AutotrimDialog,
} from 'app/pages/storage/components/dashboard-pool/storage-health-card/autotrim-dialog/autotrim-dialog.component';
import {
  DeduplicationStatsComponent,
} from 'app/pages/storage/components/dashboard-pool/storage-health-card/deduplication-stats/deduplication-stats.component';
import {
  LastPoolScanComponent,
} from 'app/pages/storage/components/dashboard-pool/storage-health-card/last-pool-scan/last-pool-scan.component';
import { storageHealthCardElements } from 'app/pages/storage/components/dashboard-pool/storage-health-card/storage-health-card.elements';
import { PoolsDashboardStore } from 'app/pages/storage/stores/pools-dashboard-store.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

enum AutoTrimValue {
  On = 'on',
  Off = 'off',
}

@UntilDestroy()
@Component({
  selector: 'ix-storage-health-card',
  templateUrl: './storage-health-card.component.html',
  styleUrls: ['./storage-health-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    TranslateModule,
    TooltipComponent,
    ActivePoolScanComponent,
    LastPoolScanComponent,
    ScheduleDescriptionPipe,
    DeduplicationStatsComponent,
  ],
})
export class StorageHealthCardComponent implements OnChanges {
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  private translate = inject(TranslateService);
  private dialogService = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);
  private matDialog = inject(MatDialog);
  private store = inject(PoolsDashboardStore);
  private slideIn = inject(SlideIn);
  private router = inject(Router);

  readonly pool = input.required<Pool>();

  readonly scrub = computed(() => this.store.scrubForPool(this.pool()));

  protected readonly searchableElements = storageHealthCardElements;

  protected scan = signal<PoolScanUpdate | null>(null);

  totalZfsErrors = 0;
  poolScanSubscription: Subscription;

  protected readonly helptextVolumes = helptextVolumes;

  readonly poolStatusLabels = poolStatusLabels;
  protected readonly Role = Role;
  protected readonly AutoTrimValue = AutoTrimValue;

  protected readonly wasScanInitiated = computed(() => this.scan()?.state === PoolScanState.Scanning);
  protected readonly isScrub = computed(() => this.scan()?.function === PoolScanFunction.Scrub);

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
    this.scan.set(this.pool().scan);

    this.subscribeToScan();
    this.calculateTotalZfsErrors();
  }

  protected onStartScrub(): void {
    const message = this.translate.instant('Start scrub on pool <i>{poolName}</i>?', { poolName: this.pool().name });
    this.dialogService.confirm({
      message,
      hideCheckbox: true,
      title: this.translate.instant('Scrub Pool'),
      buttonText: this.translate.instant('Start Scrub'),
    })
      .pipe(
        filter(Boolean),
        switchMap(() => this.api.startJob('pool.scrub', [this.pool().id, PoolScrubAction.Start])),
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe();
  }

  protected onEditAutotrim(): void {
    this.matDialog
      .open(AutotrimDialog, { data: this.pool() })
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.store.loadDashboard());
  }

  private subscribeToScan(): void {
    if (this.poolScanSubscription && !this.poolScanSubscription.closed) {
      this.poolScanSubscription.unsubscribe();
    }
    this.poolScanSubscription = this.api.subscribe('pool.scan')
      .pipe(
        map((apiEvent) => apiEvent.fields),
        filter((scan) => scan.name === this.pool().name),
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe((scan) => {
        this.scan.set(scan.scan);
        this.cdr.markForCheck();
      });
  }

  protected onConfigureScrub(): void {
    this.slideIn.open(ScrubFormComponent, {
      data: {
        poolId: this.pool().id,
        existingScrubTask: this.scrub(),
      },
    })
      .pipe(
        filter((result) => result?.response),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.store.loadDashboard();
      });
  }

  protected getErrorText(): string {
    const vdevErrors = this.countVdevErrors();
    const physErrors = this.countPhysDiskErrors();

    const statusStr = this.translate.instant(this.pool().status);
    let errorStr = '';
    if (vdevErrors === 0 && physErrors === 0) {
      errorStr = 'No errors.';
    } else {
      errorStr += vdevErrors === 0 ? 'no VDEV errors' : `${vdevErrors} VDEV errors`;
      errorStr += ', ';
      errorStr += physErrors === 0 ? 'no disk errors' : `${physErrors} disk errors.`;
    }

    return `${statusStr}, ${errorStr}`;
  }

  protected hasErrors(): boolean {
    return (this.countPhysDiskErrors() + this.countPhysDiskErrors()) > 0;
  }

  protected goToDiskError(): void {
    const poolId = this.pool().id;
    const topo = Object.values(this.pool().topology);

    const firstBadVdev = topo.flat()
      .reduce((acc, item) => {
        if (item?.children) {
          return [...acc, ...item.children];
        }
        return [...acc, item];
      }, [])
      .find(
        (item) => (item.stats.read_errors > 0) || (item.stats.write_errors > 0) || (item.stats.checksum_errors > 0),
      );

    this.router.navigate(['/storage', poolId.toString(), 'vdevs', firstBadVdev?.guid]);
  }

  private countVdevErrors(): number {
    return Object.values(this.pool().topology).reduce((totalErrors: number, vdevs: VDevItem[]) => {
      return totalErrors + vdevs.reduce((vdevCategoryErrors, vdev) => {
        return vdevCategoryErrors
          + (vdev.stats?.read_errors || 0)
          + (vdev.stats?.write_errors || 0)
          + (vdev.stats?.checksum_errors || 0);
      }, 0);
    }, 0);
  }

  private countPhysDiskErrors(): number {
    const count = (items: VDevItem[]): number => {
      return items.map((item): number => {
        if (item?.children && item.children.length > 0) {
          return count(item.children);
        }

        return (item?.stats?.read_errors ?? 0) + (item?.stats?.write_errors ?? 0) + (item?.stats?.checksum_errors ?? 0);
      })
        .reduce((acc, val) => acc + val, 0);
    };
    const topo = Object.values(this.pool().topology);

    return topo.map(count).reduce((acc, counts) => acc + counts, 0);
  }

  private calculateTotalZfsErrors(): void {
    if (!this.pool().topology) {
      return;
    }
    this.totalZfsErrors = this.countVdevErrors();
  }
}
