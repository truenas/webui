import {
  ChangeDetectionStrategy, Component, DestroyRef, input, OnChanges, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  tnIconMarker,
  TnCardComponent,
  TnCellDefDirective,
  TnHeaderCellDefDirective,
  TnSpinnerComponent,
  TnTableColumnDirective,
  TnTableComponent,
  TnTablePagerComponent,
} from '@truenas/ui-components';
import {
  catchError,
  EMPTY,
  filter, finalize, map, switchMap,
} from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { tapOnce } from 'app/helpers/operators/tap-once.operator';
import { translated } from 'app/helpers/translated.helper';
import { CloudBackup, CloudBackupSnapshot } from 'app/interfaces/cloud-backup.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { AsyncDataProvider } from 'app/modules/tn-table/classes/async-data-provider/async-data-provider';
import { IconActionConfig } from 'app/modules/tn-table/interfaces/icon-action-config.interface';
import { tnTableListHost } from 'app/modules/tn-table/utils';
import { TableActionsCellComponent } from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import {
  TableRelativeDateCellComponent,
} from 'app/modules/tn-table-cells/relative-date-cell/table-relative-date-cell.component';
import { TableTextCellComponent } from 'app/modules/tn-table-cells/text-cell/table-text-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { CloudBackupRestoreFromSnapshotFormComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-details/cloud-backup-restore-form-snapshot-form/cloud-backup-restore-from-snapshot-form.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-cloud-backup-snapshots',
  templateUrl: './cloud-backup-snapshots.component.html',
  styleUrls: ['./cloud-backup-snapshots.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TableRelativeDateCellComponent,
    TableTextCellComponent,
    TableActionsCellComponent,
    TnSpinnerComponent,
    TnTablePagerComponent,
    TranslateModule,
  ],
})
export class CloudBackupSnapshotsComponent implements OnChanges {
  private formPanel = inject(FormSidePanelService);
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private dialog = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);
  private loader = inject(LoaderService);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);

  readonly backup = input.required<CloudBackup>();

  protected readonly requiredRoles = [Role.CloudBackupWrite];

  // Rebuilt whenever the `backup` input changes, so the provider is held in a signal
  // and the row/loading/empty signals track whichever provider is current.
  protected readonly dataProvider = signal(new AsyncDataProvider<CloudBackupSnapshot>(EMPTY));

  // One source of truth per column title: the header, the cell (whose test id is built
  // from it) and the column model all read the same entry, so a rename cannot silently
  // change a data-test value. `translated` re-runs it on a language change. (This list has no
  // column picker, so the titles are read only from the template and follow along directly.)
  protected readonly titles = translated(() => ({
    snapshotTime: this.translate.instant('Snapshot Time'),
    hostname: this.translate.instant('Hostname'),
  }));

  protected readonly list = tnTableListHost<CloudBackupSnapshot>(this.dataProvider, {
    // `time` is a `{ $date }` wrapper, not a sortable scalar, so it needs an accessor.
    displayedColumns: [{ name: 'time', sortBy: (row) => row.time.$date }, 'hostname', 'actions'],
  });

  protected readonly actions: IconActionConfig<CloudBackupSnapshot>[] = [
    {
      iconName: tnIconMarker('restore', 'mdi'),
      tooltip: this.translate.instant('Restore'),
      onClick: (row) => this.restore(row),
      requiredRoles: this.requiredRoles,
    },
    {
      iconName: tnIconMarker('delete', 'mdi'),
      tooltip: this.translate.instant('Delete'),
      requiredRoles: [Role.CloudBackupWrite],
      onClick: (row) => this.doDelete(row),
    },
  ];

  protected readonly trackBySnapshotId = (_index: number, row: CloudBackupSnapshot): string => row.id;

  protected readonly uniqueRowTag = this.list.rowTag((row) => 'cloud-backup-snapshot-' + row.hostname);

  protected readonly ariaLabel = this.list.perRow(
    (row) => [row.hostname, this.translate.instant('Cloud Backup Snapshot')].join(' '),
  );

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (!changes.backup.currentValue?.id) {
      return;
    }

    const cloudBackupSnapshots$ = this.api.call('cloud_backup.list_snapshots', [this.backup().id]).pipe(
      map((snapshots) => [...snapshots].sort((a, b) => b.time.$date - a.time.$date)),
      takeUntilDestroyed(this.destroyRef),
    );
    this.dataProvider().unsubscribe();
    this.dataProvider.set(new AsyncDataProvider<CloudBackupSnapshot>(cloudBackupSnapshots$));
    this.getCloudBackupSnapshots();
  }

  private getCloudBackupSnapshots(): void {
    this.dataProvider().load();
  }

  private restore(row: CloudBackupSnapshot): void {
    this.formPanel.open(CloudBackupRestoreFromSnapshotFormComponent, {
      title: this.translate.instant('Restore from Snapshot'),
      inputs: {
        restoreData: {
          snapshot: row,
          backup: this.backup(),
        },
      },
    }).onSuccess(() => this.getCloudBackupSnapshots(), this.destroyRef);
  }

  private doDelete(row: CloudBackupSnapshot): void {
    this.dialog
      .confirm({
        title: this.translate.instant('Delete Snapshot'),
        message: this.translate.instant('Are you sure you want to delete the <b>{name}</b>?', {
          name: row.hostname,
        }),
        buttonColor: 'warn',
        buttonText: this.translate.instant('Delete'),
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.api.job('cloud_backup.delete_snapshot', [this.backup().id, row.id])),
        tapOnce(() => this.loader.open()),
        catchError((error: unknown) => {
          this.errorHandler.showErrorModal(error);
          return EMPTY;
        }),
        finalize(() => this.loader.close()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((job) => {
        if (job.state === JobState.Success) {
          this.snackbar.success(this.translate.instant('Snapshot deleted.'));
          this.getCloudBackupSnapshots();
        }
      });
  }
}
