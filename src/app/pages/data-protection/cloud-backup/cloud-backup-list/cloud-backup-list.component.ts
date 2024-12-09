import { BreakpointObserver, BreakpointState, Breakpoints } from '@angular/cdk/layout';
import { NgTemplateOutlet, AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  filter, of, switchMap, tap,
} from 'rxjs';
import { DetailsHeightDirective } from 'app/directives/details-height/details-height.directive';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { tapOnce } from 'app/helpers/operators/tap-once.operator';
import { WINDOW } from 'app/helpers/window.helper';
import { CloudBackup, CloudBackupUpdate } from 'app/interfaces/cloud-backup.interface';
import { Job } from 'app/interfaces/job.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { relativeDateColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-relative-date/ix-cell-relative-date.component';
import { stateButtonColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-state-button/ix-cell-state-button.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import {
  toggleColumn,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-toggle/ix-cell-toggle.component';
import { yesNoColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-yes-no/ix-cell-yes-no.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { CloudBackupDetailsComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-details/cloud-backup-details.component';
import { CloudBackupFormComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-form/cloud-backup-form.component';
import { cloudBackupListElements } from 'app/pages/data-protection/cloud-backup/cloud-backup-list/cloud-backup-list.elements';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ApiService } from 'app/services/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-cloud-backup-list',
  templateUrl: './cloud-backup-list.component.html',
  styleUrl: './cloud-backup-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    PageHeaderComponent,
    SearchInput1Component,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    UiSearchDirective,
    NgTemplateOutlet,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableBodyComponent,
    IxTablePagerComponent,
    DetailsHeightDirective,
    CloudBackupDetailsComponent,
    IxTableHeadComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class CloudBackupListComponent implements OnInit {
  cloudBackups: CloudBackup[] = [];
  isMobileView = false;
  filterString = '';
  dataProvider: AsyncDataProvider<CloudBackup>;
  showMobileDetails = false;
  readonly requiredRoles = [Role.CloudBackupWrite];
  protected readonly searchableElements = cloudBackupListElements;

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
    relativeDateColumn({
      title: this.translate.instant('Last Run'),
      getValue: (row) => row.job?.time_finished?.$date,
    }),
    actionsColumn({
      cssClass: 'wide-actions',
      actions: [
        {
          iconName: iconMarker('edit'),
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.openForm(row),
        },
        {
          iconName: iconMarker('mdi-play-circle'),
          tooltip: this.translate.instant('Run job'),
          hidden: (row) => of(row.job?.state === JobState.Running),
          onClick: (row) => this.runNow(row),
          requiredRoles: this.requiredRoles,
        },
        {
          iconName: iconMarker('mdi-delete'),
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => this.doDelete(row),
          requiredRoles: this.requiredRoles,
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => 'cloud-backup-' + row.description,
    ariaLabels: (row) => [row.description, this.translate.instant('Cloud Backup')],
  });

  constructor(
    private cdr: ChangeDetectorRef,
    private api: ApiService,
    private translate: TranslateService,
    private chainedSlideInService: ChainedSlideInService,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    private snackbar: SnackbarService,
    private appLoader: AppLoaderService,
    private breakpointObserver: BreakpointObserver,
    private route: ActivatedRoute,
    protected emptyService: EmptyService,
    @Inject(WINDOW) private window: Window,
  ) {}

  ngOnInit(): void {
    this.route.fragment.pipe(
      tap((id) => this.loadCloudBackups(id)),
      untilDestroyed(this),
    ).subscribe();

    this.initMobileView();
  }

  closeMobileDetails(): void {
    this.showMobileDetails = false;
    this.dataProvider.expandedRow = null;
    this.cdr.markForCheck();
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
      switchMap(() => this.api.job('cloud_backup.sync', [row.id])),
      untilDestroyed(this),
    ).subscribe({
      next: (job: Job) => {
        this.updateRowJob(row, job);
        // Update expanded row to call child ngOnChanges method & update snapshots list
        if (job.state === JobState.Success && this.dataProvider.expandedRow?.id === row.id) {
          this.dataProvider.expandedRow = { ...row };
        }
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
      switchMap(() => this.api.call('cloud_backup.delete', [row.id]).pipe(this.appLoader.withLoader())),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.getCloudBackups();
      },
      error: (err: unknown) => {
        this.dialogService.error(this.errorHandler.parseError(err));
      },
    });
  }

  onListFiltered(query: string): void {
    this.filterString = query;
    this.dataProvider.setFilter({ query, columnKeys: ['description'] });
  }

  expanded(row: CloudBackup): void {
    if (!row) {
      return;
    }

    if (this.isMobileView) {
      this.showMobileDetails = true;
      this.cdr.markForCheck();

      // TODO: Do not rely on querying DOM elements
      // focus on details container
      setTimeout(() => (this.window.document.getElementsByClassName('mobile-back-button')[0] as HTMLElement).focus(), 0);
    }
  }

  private loadCloudBackups(id?: string): void {
    const cloudBackups$ = this.api.call('cloud_backup.query').pipe(
      tap((cloudBackups) => {
        this.cloudBackups = cloudBackups;

        const selectedBackup = id
          ? cloudBackups.find((cloudBackup) => cloudBackup.id.toString() === id)
          : cloudBackups.find((cloudBackup) => cloudBackup.id === this.dataProvider?.expandedRow?.id);

        this.dataProvider.expandedRow = this.isMobileView ? null : (selectedBackup || cloudBackups[0]);
        this.expanded(this.dataProvider.expandedRow);
      }),
    );

    this.dataProvider = new AsyncDataProvider<CloudBackup>(cloudBackups$);
    this.getCloudBackups();
  }

  private onChangeEnabledState(cloudBackup: CloudBackup): void {
    this.api
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

  private initMobileView(): void {
    this.breakpointObserver
      .observe([Breakpoints.XSmall, Breakpoints.Small, Breakpoints.Medium])
      .pipe(untilDestroyed(this))
      .subscribe((state: BreakpointState) => {
        if (state.matches) {
          this.isMobileView = true;
          if (this.dataProvider?.expandedRow) {
            this.expanded(this.dataProvider.expandedRow);
          } else {
            this.closeMobileDetails();
          }
        } else {
          this.isMobileView = false;
        }
        this.cdr.markForCheck();
      });
  }
}
