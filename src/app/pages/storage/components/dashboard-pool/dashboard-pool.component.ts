import {
  ChangeDetectionStrategy, Component, input,
  OnChanges,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { filter, switchMap, tap } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { helptextVolumes } from 'app/helptext/storage/volumes/volume-list';
import { Dataset } from 'app/interfaces/dataset.interface';
import { StorageDashboardDisk } from 'app/interfaces/disk.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { searchDelayConst } from 'app/modules/global-search/constants/delay.const';
import { UiSearchDirectivesService } from 'app/modules/global-search/services/ui-search-directives.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { dashboardPoolElements } from 'app/pages/storage/components/dashboard-pool/dashboard-pool.elements';
import {
  ExportDisconnectModalComponent,
} from 'app/pages/storage/components/dashboard-pool/export-disconnect-modal/export-disconnect-modal.component';
import { PoolsDashboardStore } from 'app/pages/storage/stores/pools-dashboard-store.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { DiskHealthCardComponent } from './disk-health-card/disk-health-card.component';
import { PoolUsageCardComponent } from './pool-usage-card/pool-usage-card.component';
import { TopologyCardComponent } from './topology-card/topology-card.component';
import { ZfsHealthCardComponent } from './zfs-health-card/zfs-health-card.component';

@UntilDestroy()
@Component({
  selector: 'ix-dashboard-pool',
  templateUrl: './dashboard-pool.component.html',
  styleUrls: ['./dashboard-pool.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    UiSearchDirective,
    TopologyCardComponent,
    PoolUsageCardComponent,
    ZfsHealthCardComponent,
    DiskHealthCardComponent,
    NgxSkeletonLoaderModule,
    MatCard,
    MatCardContent,
    TranslateModule,
  ],
})
export class DashboardPoolComponent implements OnChanges {
  readonly pool = input<Pool>();
  readonly rootDataset = input<Dataset>();
  readonly isLoading = input<boolean>();
  readonly disks = input<StorageDashboardDisk[]>();

  protected readonly requiredRoles = [Role.PoolWrite];
  protected readonly searchableElements = dashboardPoolElements;

  constructor(
    private matDialog: MatDialog,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    private translate: TranslateService,
    private loader: AppLoaderService,
    private api: ApiService,
    private snackbar: SnackbarService,
    private store: PoolsDashboardStore,
    private searchDirectives: UiSearchDirectivesService,
  ) {}

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (changes.isLoading || !this.isLoading()) {
      setTimeout(() => this.handlePendingGlobalSearchElement(), searchDelayConst * 2);
    }
  }

  onExport(): void {
    this.matDialog
      .open(ExportDisconnectModalComponent, {
        data: this.pool(),
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((needRefresh: boolean) => {
        if (!needRefresh) {
          return;
        }

        this.store.loadDashboard();
      });
  }

  onExpand(): void {
    this.dialogService.confirm({
      title: this.translate.instant(helptextVolumes.expand_pool_dialog.title),
      message: this.translate.instant(helptextVolumes.expand_pool_dialog.message),
    })
      .pipe(
        filter(Boolean),
        switchMap(() => {
          return this.api.job('pool.expand', [this.pool().id]).pipe(this.loader.withLoader());
        }),
        filter((job) => job.state === JobState.Success),
        tap(() => {
          this.snackbar.success(
            this.translate.instant('Successfully expanded pool {name}.', { name: this.pool().name }),
          );
          this.store.loadDashboard();
        }),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe();
  }

  onUpgrade(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Upgrade Pool'),
      message: this.translate.instant(helptextVolumes.upgradePoolDialog_warning) + this.pool().name,
    }).pipe(
      filter(Boolean),
      switchMap(() => {
        return this.api.call('pool.upgrade', [this.pool().id]).pipe(this.loader.withLoader());
      }),
      tap(() => {
        this.snackbar.success(
          this.translate.instant('Pool {name} successfully upgraded.', { name: this.pool().name }),
        );
        this.store.loadDashboard();
      }),
      this.errorHandler.catchError(),
      untilDestroyed(this),
    ).subscribe();
  }

  counter(i: number): number[] {
    return new Array<number>(i).fill(0).map((_, index) => index);
  }

  private handlePendingGlobalSearchElement(): void {
    const pendingHighlightElement = this.searchDirectives.pendingUiHighlightElement;

    if (pendingHighlightElement) {
      this.searchDirectives.get(pendingHighlightElement)?.highlight(pendingHighlightElement);
    }
  }
}
