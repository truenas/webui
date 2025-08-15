import { ChangeDetectionStrategy, Component, input, OnChanges, inject } from '@angular/core';
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
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { dashboardPoolElements } from 'app/pages/storage/components/dashboard-pool/dashboard-pool.elements';
import {
  ExportDisconnectModalComponent,
} from 'app/pages/storage/components/dashboard-pool/export-disconnect-modal/export-disconnect-modal.component';
import { VDevsCardComponent } from 'app/pages/storage/components/dashboard-pool/vdevs-card/vdevs-card.component';
import { PoolsDashboardStore } from 'app/pages/storage/stores/pools-dashboard-store.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { DiskHealthCardComponent } from './disk-health-card/disk-health-card.component';
import { PoolUsageCardComponent } from './pool-usage-card/pool-usage-card.component';
import { StorageHealthCardComponent } from './storage-health-card/storage-health-card.component';

@UntilDestroy()
@Component({
  selector: 'ix-dashboard-pool',
  templateUrl: './dashboard-pool.component.html',
  styleUrls: ['./dashboard-pool.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    UiSearchDirective,
    VDevsCardComponent,
    PoolUsageCardComponent,
    StorageHealthCardComponent,
    DiskHealthCardComponent,
    NgxSkeletonLoaderModule,
    MatCard,
    MatCardContent,
    TranslateModule,
  ],
})
export class DashboardPoolComponent implements OnChanges {
  private matDialog = inject(MatDialog);
  private dialogService = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);
  private translate = inject(TranslateService);
  private loader = inject(LoaderService);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);
  private store = inject(PoolsDashboardStore);
  private searchDirectives = inject(UiSearchDirectivesService);

  readonly pool = input<Pool>();
  readonly rootDataset = input<Dataset>();
  readonly isLoading = input<boolean>();
  readonly disks = input<StorageDashboardDisk[]>([]);

  protected readonly requiredRoles = [Role.PoolWrite];
  protected readonly searchableElements = dashboardPoolElements;

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
      title: this.translate.instant(helptextVolumes.expandPoolDialog.title),
      message: this.translate.instant(helptextVolumes.expandPoolDialog.message),
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
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe();
  }

  onUpgrade(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Upgrade Pool'),
      message: this.translate.instant(helptextVolumes.upgradePoolDialogWarning) + this.pool().name as TranslatedString,
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
      this.errorHandler.withErrorHandler(),
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
