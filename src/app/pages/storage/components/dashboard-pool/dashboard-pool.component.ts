import {
  ChangeDetectionStrategy, Component, Input,
  OnChanges,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, switchMap, tap } from 'rxjs/operators';
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
import { dashboardPoolElements } from 'app/pages/storage/components/dashboard-pool/dashboard-pool.elements';
import {
  ExportDisconnectModalComponent,
} from 'app/pages/storage/components/dashboard-pool/export-disconnect-modal/export-disconnect-modal.component';
import { PoolsDashboardStore } from 'app/pages/storage/stores/pools-dashboard-store.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-dashboard-pool',
  templateUrl: './dashboard-pool.component.html',
  styleUrls: ['./dashboard-pool.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPoolComponent implements OnChanges {
  @Input() pool: Pool;
  @Input() rootDataset: Dataset;
  @Input() isLoading: boolean;
  @Input() disks: StorageDashboardDisk[];

  readonly requiredRoles = [Role.FullAdmin];
  protected readonly searchableElements = dashboardPoolElements;

  constructor(
    private matDialog: MatDialog,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    private translate: TranslateService,
    private loader: AppLoaderService,
    private ws: WebSocketService,
    private snackbar: SnackbarService,
    private store: PoolsDashboardStore,
    private searchDirectives: UiSearchDirectivesService,
  ) {}

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (changes.isLoading || !this.isLoading) {
      setTimeout(() => this.handlePendingGlobalSearchElement(), searchDelayConst * 2);
    }
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
          return this.ws.job('pool.expand', [this.pool.id]).pipe(this.loader.withLoader());
        }),
        filter((job) => job.state === JobState.Success),
        tap(() => {
          this.snackbar.success(
            this.translate.instant('Successfully expanded pool {name}.', { name: this.pool.name }),
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
      message: this.translate.instant(helptextVolumes.upgradePoolDialog_warning) + this.pool.name,
    }).pipe(
      filter(Boolean),
      switchMap(() => {
        return this.ws.call('pool.upgrade', [this.pool.id]).pipe(this.loader.withLoader());
      }),
      tap(() => {
        this.snackbar.success(
          this.translate.instant('Pool {name} successfully upgraded.', { name: this.pool.name }),
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
