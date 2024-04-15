import {
  ChangeDetectionStrategy, Component, Input,
  OnChanges,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, switchMap } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { CloudBackup, CloudBackupSnapshot } from 'app/interfaces/cloud-backup.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table2/classes/async-data-provider/async-data-provider';
import { actionsColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { createTable } from 'app/modules/ix-table2/utils';
import { CloudBackupRestoreFromSnapshotFormComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-details/cloud-backup-restore-form-snapshot-form/cloud-backup-restore-from-snapshot-form.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-cloud-backup-snapshots',
  templateUrl: './cloud-backup-snapshots.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CloudBackupSnapshotsComponent implements OnChanges {
  @Input() backup: CloudBackup;

  readonly requiredRoles = [Role.CloudBackupWrite];

  dataProvider: AsyncDataProvider<CloudBackupSnapshot>;

  columns = createTable<CloudBackupSnapshot>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'hostname',
    }),
    actionsColumn({
      actions: [
        {
          iconName: 'delete',
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => this.doDelete(row),
          requiredRoles: this.requiredRoles,
        },
        {
          iconName: 'restore',
          tooltip: this.translate.instant('Restore'),
          onClick: (row) => this.restore(row),
          requiredRoles: this.requiredRoles,
        },
      ],
    }),
  ], {
    rowTestId: (row) => 'cloud-backup-snapshot-' + row.hostname + '-' + row.paths.join('-'),
  });

  constructor(
    private slideIn: IxSlideInService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private ws: WebSocketService,
    private dialogService: DialogService,
    protected emptyService: EmptyService,
  ) {}

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (!changes.backup.currentValue) {
      return;
    }

    const cloudBackupSnapshots$ = this.ws.call('cloud_backup.list_snapshots', [this.backup.id])
      .pipe(untilDestroyed(this));

    this.dataProvider = new AsyncDataProvider<CloudBackupSnapshot>(cloudBackupSnapshots$);
    this.getCloudBackupSnapshots();
  }

  getCloudBackupSnapshots(): void {
    this.dataProvider.load();
  }

  private doDelete(row: CloudBackupSnapshot): void {
    this.dialogService.confirm({
      title: this.translate.instant('Confirmation'),
      message: this.translate.instant('Delete Cloud Backup Snapshot <b>"{value}"</b>?', {
        value: row.hostname,
      }),
    }).pipe(
      filter(Boolean),
      switchMap(() => this.ws.call('cloud_backup.delete_snapshot', [row.id])),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.getCloudBackupSnapshots();
      },
      error: (err) => {
        this.dialogService.error(this.errorHandler.parseError(err));
      },
    });
  }

  private restore(row: CloudBackupSnapshot): void {
    this.slideIn.open(CloudBackupRestoreFromSnapshotFormComponent, { data: row })
      .slideInClosed$
      .pipe(
        filter((response) => !!response),
        untilDestroyed(this),
      ).subscribe({
        next: () => {
          this.getCloudBackupSnapshots();
        },
      });
  }
}
