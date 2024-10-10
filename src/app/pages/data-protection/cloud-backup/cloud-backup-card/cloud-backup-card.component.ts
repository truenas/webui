import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  filter, of, switchMap, tap,
} from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { formatDistanceToNowShortened } from 'app/helpers/format-distance-to-now-shortened';
import { tapOnce } from 'app/helpers/operators/tap-once.operator';
import { WINDOW } from 'app/helpers/window.helper';
import { CloudBackup, CloudBackupUpdate } from 'app/interfaces/cloud-backup.interface';
import { Job } from 'app/interfaces/job.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { stateButtonColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-state-button/ix-cell-state-button.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import {
  toggleColumn,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-toggle/ix-cell-toggle.component';
import { yesNoColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-yes-no/ix-cell-yes-no.component';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { CloudBackupFormComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-form/cloud-backup-form.component';
import { replicationListElements } from 'app/pages/data-protection/replication/replication-list/replication-list.elements';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-cloud-backup-card',
  templateUrl: './cloud-backup-card.component.html',
  styleUrl: './cloud-backup-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CloudBackupCardComponent implements OnInit {
  cloudBackups: CloudBackup[] = [];
  dataProvider: AsyncDataProvider<CloudBackup>;
  readonly requiredRoles = [Role.CloudBackupWrite];
  protected readonly searchableElements = replicationListElements;

  columns = createTable<CloudBackup>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'description',
    }),
    toggleColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
      onRowToggle: (row) => this.onChangeEnabledState(row),
      requiredRoles: this.requiredRoles,
    }),
    yesNoColumn({
      title: this.translate.instant('Snapshot'),
      propertyName: 'snapshot',
    }),
    stateButtonColumn({
      title: this.translate.instant('State'),
      getValue: (row) => row?.job?.state,
      getJob: (row) => row.job,
      cssClass: 'state-button',
    }),
    textColumn({
      title: this.translate.instant('Last Run'),
      getValue: (row) => {
        if (row.job?.time_finished) {
          return formatDistanceToNowShortened(row.job?.time_finished.$date);
        }
        return this.translate.instant('N/A');
      },
    }),
    actionsColumn({
      cssClass: 'wide-actions',
      actions: [
        {
          iconName: 'edit',
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.openForm(row),
        },
        {
          iconName: 'mdi-play-circle',
          tooltip: this.translate.instant('Run job'),
          hidden: (row) => of(row.job?.state === JobState.Running),
          onClick: (row) => this.runNow(row),
          requiredRoles: this.requiredRoles,
        },
        {
          iconName: 'visibility',
          tooltip: this.translate.instant('View Details'),
          onClick: (row) => this.router.navigate(['/data-protection', 'cloud-backup'], { fragment: row.id.toString() }),
          requiredRoles: this.requiredRoles,
        },
        {
          iconName: 'delete',
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => this.doDelete(row),
          requiredRoles: this.requiredRoles,
        },
      ],
    }),
  ], {
    rowTestId: (row) => 'cloud-backup-' + row.description,
    ariaLabels: (row) => [row.description, this.translate.instant('Cloud Backup')],
  });

  constructor(
    private cdr: ChangeDetectorRef,
    private ws: WebSocketService,
    private translate: TranslateService,
    private chainedSlideInService: IxChainedSlideInService,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    private snackbar: SnackbarService,
    private appLoader: AppLoaderService,
    private router: Router,
    protected emptyService: EmptyService,
    @Inject(WINDOW) private window: Window,
  ) {}

  ngOnInit(): void {
    const cloudBackups$ = this.ws.call('cloud_backup.query').pipe(
      tap((cloudBackups) => this.cloudBackups = cloudBackups),
    );
    this.dataProvider = new AsyncDataProvider<CloudBackup>(cloudBackups$);
    this.getCloudBackups();
  }

  setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 1,
      direction: SortDirection.Asc,
      propertyName: 'description',
    });
  }

  getCloudBackups(): void {
    this.dataProvider.load();
  }

  runNow(row: CloudBackup): void {
    this.dialogService.confirm({
      title: this.translate.instant('Run Now'),
      message: this.translate.instant('Run «{name}» Cloud Backup now?', { name: row.description }),
      hideCheckbox: true,
    }).pipe(
      filter(Boolean),
      tap(() => this.updateRowJob(row, { ...row.job, state: JobState.Running })),
      tapOnce(() => {
        this.snackbar.success(this.translate.instant('Cloud Backup «{name}» has started.', { name: row.description }));
      }),
      switchMap(() => this.ws.job('cloud_backup.sync', [row.id])),
      untilDestroyed(this),
    ).subscribe({
      next: (job: Job) => {
        this.updateRowJob(row, job);
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.dialogService.error(this.errorHandler.parseError(error));
        this.getCloudBackups();
      },
    });
  }

  openForm(row?: CloudBackup): void {
    this.chainedSlideInService.open(CloudBackupFormComponent, true, row)
      .pipe(
        filter((response) => !!response.response),
        untilDestroyed(this),
      ).subscribe({
        next: () => {
          this.getCloudBackups();
        },
      });
  }

  doDelete(row: CloudBackup): void {
    this.dialogService.confirm({
      title: this.translate.instant('Confirmation'),
      message: this.translate.instant('Delete Cloud Backup <b>"{name}"</b>?', {
        name: row.description,
      }),
    }).pipe(
      filter(Boolean),
      switchMap(() => this.ws.call('cloud_backup.delete', [row.id]).pipe(this.appLoader.withLoader())),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.getCloudBackups();
      },
      error: (err) => {
        this.dialogService.error(this.errorHandler.parseError(err));
      },
    });
  }

  private onChangeEnabledState(cloudBackup: CloudBackup): void {
    this.ws
      .call('cloud_backup.update', [cloudBackup.id, { enabled: !cloudBackup.enabled } as CloudBackupUpdate])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.getCloudBackups();
        },
        error: (err: unknown) => {
          this.getCloudBackups();
          this.dialogService.error(this.errorHandler.parseError(err));
        },
      });
  }

  private updateRowJob(row: CloudBackup, job: Job): void {
    this.dataProvider.setRows(this.cloudBackups.map((task) => {
      if (task.id === row.id) {
        return {
          ...task,
          job,
        };
      }
      return task;
    }));
  }
}
