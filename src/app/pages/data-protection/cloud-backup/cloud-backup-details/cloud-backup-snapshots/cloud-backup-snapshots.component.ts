import {
  ChangeDetectionStrategy, Component, Input,
  OnChanges,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  catchError,
  EMPTY,
  filter, finalize, map, switchMap,
} from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { tapOnce } from 'app/helpers/operators/tap-once.operator';
import { CloudBackup, CloudBackupSnapshot } from 'app/interfaces/cloud-backup.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { relativeDateColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-relative-date/ix-cell-relative-date.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { createTable } from 'app/modules/ix-table/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { CloudBackupRestoreFromSnapshotFormComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-details/cloud-backup-restore-form-snapshot-form/cloud-backup-restore-from-snapshot-form.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-cloud-backup-snapshots',
  templateUrl: './cloud-backup-snapshots.component.html',
  styleUrls: ['./cloud-backup-snapshots.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CloudBackupSnapshotsComponent implements OnChanges {
  @Input() backup: CloudBackup;

  readonly requiredRoles = [Role.CloudBackupWrite];

  dataProvider: AsyncDataProvider<CloudBackupSnapshot>;

  columns = createTable<CloudBackupSnapshot>([
    relativeDateColumn({
      title: this.translate.instant('Snapshot Time'),
      getValue: (row) => row.time.$date,
    }),
    textColumn({
      title: this.translate.instant('Hostname'),
      propertyName: 'hostname',
    }),
    actionsColumn({
      actions: [
        {
          iconName: 'restore',
          tooltip: this.translate.instant('Restore'),
          onClick: (row) => this.restore(row),
          requiredRoles: this.requiredRoles,
        },
        {
          iconName: 'delete',
          tooltip: this.translate.instant('Delete'),
          requiredRoles: [Role.FullAdmin],
          onClick: (row) => this.doDelete(row),
        },
      ],
    }),
  ], {
    rowTestId: (row) => 'cloud-backup-snapshot-' + row.hostname,
    ariaLabels: (row) => [row.hostname, this.translate.instant('Cloud Backup Snapshot')],
  });

  constructor(
    protected emptyService: EmptyService,
    private slideIn: IxSlideInService,
    private translate: TranslateService,
    private ws: WebSocketService,
    private dialog: DialogService,
    private errorHandler: ErrorHandlerService,
    private loader: AppLoaderService,
    private snackbar: SnackbarService,
  ) {}

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (!changes.backup.currentValue?.id) {
      return;
    }

    const cloudBackupSnapshots$ = this.ws.call('cloud_backup.list_snapshots', [this.backup.id]).pipe(
      map((snapshots) => [...snapshots].sort((a, b) => b.time.$date - a.time.$date)),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider<CloudBackupSnapshot>(cloudBackupSnapshots$);
    this.getCloudBackupSnapshots();
  }

  private getCloudBackupSnapshots(): void {
    this.dataProvider.load();
  }

  private restore(row: CloudBackupSnapshot): void {
    const slideInRef = this.slideIn.open(CloudBackupRestoreFromSnapshotFormComponent, {
      data: {
        snapshot: row,
        backup: this.backup,
      },
    });

    slideInRef.slideInClosed$.pipe(
      filter((response) => !!response),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.getCloudBackupSnapshots();
      },
    });
  }

  doDelete(row: CloudBackupSnapshot): void {
    this.dialog
      .confirm({
        title: this.translate.instant('Delete Snapshot'),
        message: this.translate.instant('Are you sure you want to delete the <b>{name}</b>?', {
          name: row.hostname,
        }),
        buttonText: this.translate.instant('Delete'),
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.ws.job('cloud_backup.delete_snapshot', [this.backup.id, row.id])),
        tapOnce(() => this.loader.open()),
        catchError((error) => {
          this.dialog.error(this.errorHandler.parseError(error));
          return EMPTY;
        }),
        finalize(() => this.loader.close()),
        untilDestroyed(this),
      )
      .subscribe((job) => {
        if (job.state === JobState.Success) {
          this.snackbar.success(this.translate.instant('Snapshot deleted'));
          this.getCloudBackupSnapshots();
        }
      });
  }
}
