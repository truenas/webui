import {
  ChangeDetectionStrategy, Component, Input,
  OnChanges,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { CloudBackup, CloudBackupSnapshot } from 'app/interfaces/cloud-backup.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { createTable } from 'app/modules/ix-table/utils';
import { CloudBackupRestoreFromSnapshotFormComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-details/cloud-backup-restore-form-snapshot-form/cloud-backup-restore-from-snapshot-form.component';
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
    textColumn({
      title: this.translate.instant('Name'),
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
      ],
    }),
  ], {
    rowTestId: (row) => 'cloud-backup-snapshot-' + row.hostname,
  });

  constructor(
    protected emptyService: EmptyService,
    private slideIn: IxSlideInService,
    private translate: TranslateService,
    private ws: WebSocketService,
  ) {}

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (!changes.backup.currentValue?.id) {
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
}
