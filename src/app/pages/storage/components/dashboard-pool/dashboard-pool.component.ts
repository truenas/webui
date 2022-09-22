import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input,
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
import { StorageDashboardDisk } from 'app/interfaces/storage.interface';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  ExportDisconnectModalComponent,
} from 'app/pages/storage/components/dashboard-pool/export-disconnect-modal/export-disconnect-modal.component';
import { PoolsDashboardStore } from 'app/pages/storage/stores/pools-dashboard-store.service';
import { AppLoaderService, DialogService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-dashboard-pool',
  templateUrl: './dashboard-pool.component.html',
  styleUrls: ['./dashboard-pool.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPoolComponent {
  @Input() pool: Pool;
  @Input() rootDataset: Dataset;
  @Input() isLoading: boolean;
  @Input() disks: StorageDashboardDisk[];

  constructor(
    private matDialog: MatDialog,
    private dialogService: DialogService,
    private translate: TranslateService,
    private loader: AppLoaderService,
    private ws: WebSocketService,
    private snackbar: SnackbarService,
    private cdr: ChangeDetectorRef,
    private store: PoolsDashboardStore,
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

        this.store.loadDashboard();
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
          this.store.loadDashboard();
        }),
        catchError((error) => {
          this.loader.close();
          this.dialogService.errorReportMiddleware(error);
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
        this.store.loadDashboard();
      }),
      catchError((error) => {
        this.loader.close();
        this.dialogService.errorReportMiddleware(error);
        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  counter(i: number): number[] {
    return new Array(i);
  }
}
