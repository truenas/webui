import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, input,
  OnChanges,
} from '@angular/core';
import { MatCard, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
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
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { relativeDateColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-relative-date/ix-cell-relative-date.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { createTable } from 'app/modules/ix-table/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { CloudBackupRestoreFromSnapshotFormComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-details/cloud-backup-restore-form-snapshot-form/cloud-backup-restore-from-snapshot-form.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { SlideInService } from 'app/services/slide-in.service';
import { ApiService } from 'app/services/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-cloud-backup-snapshots',
  templateUrl: './cloud-backup-snapshots.component.html',
  styleUrls: ['./cloud-backup-snapshots.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    MatProgressSpinner,
    IxTablePagerComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class CloudBackupSnapshotsComponent implements OnChanges {
  readonly backup = input.required<CloudBackup>();

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
          iconName: iconMarker('restore'),
          tooltip: this.translate.instant('Restore'),
          onClick: (row) => this.restore(row),
          requiredRoles: this.requiredRoles,
        },
        {
          iconName: iconMarker('mdi-delete'),
          tooltip: this.translate.instant('Delete'),
          requiredRoles: [Role.FullAdmin],
          onClick: (row) => this.doDelete(row),
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => 'cloud-backup-snapshot-' + row.hostname,
    ariaLabels: (row) => [row.hostname, this.translate.instant('Cloud Backup Snapshot')],
  });

  constructor(
    protected emptyService: EmptyService,
    private slideIn: SlideInService,
    private translate: TranslateService,
    private api: ApiService,
    private dialog: DialogService,
    private errorHandler: ErrorHandlerService,
    private loader: AppLoaderService,
    private snackbar: SnackbarService,
  ) {}

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (!changes.backup.currentValue?.id) {
      return;
    }

    const cloudBackupSnapshots$ = this.api.call('cloud_backup.list_snapshots', [this.backup().id]).pipe(
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
        backup: this.backup(),
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
        switchMap(() => this.api.job('cloud_backup.delete_snapshot', [this.backup().id, row.id])),
        tapOnce(() => this.loader.open()),
        catchError((error: unknown) => {
          this.dialog.error(this.errorHandler.parseError(error));
          return EMPTY;
        }),
        finalize(() => this.loader.close()),
        untilDestroyed(this),
      )
      .subscribe((job) => {
        if (job.state === JobState.Success) {
          this.snackbar.success(this.translate.instant('Snapshot deleted.'));
          this.getCloudBackupSnapshots();
        }
      });
  }
}
