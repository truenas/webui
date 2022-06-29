import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, Output,
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
import { Pool } from 'app/interfaces/pool.interface';
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
export class DashboardPoolComponent {
  @Input() pool: Pool;

  @Output() poolsUpdated = new EventEmitter<void>();

  constructor(
    private matDialog: MatDialog,
    private dialogService: DialogService,
    private translate: TranslateService,
    private loader: AppLoaderService,
    private ws: WebSocketService,
    private snackbar: SnackbarService,
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
}
