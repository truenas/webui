import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, Type, effect, input, output, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  tnIconMarker,
  TnCellDefDirective,
  TnEmptyComponent,
  TnHeaderCellDefDirective,
  TnTableColumnDirective,
  TnTableComponent,
  TnTablePagerComponent,
  TnTestIdDirective,
  TnTooltipDirective,
  type TnSortEvent,
} from '@truenas/ui-components';
import {
  filter, of, switchMap, tap,
} from 'rxjs';
import { cloudBackupTaskEmptyConfig, noSearchResultsConfig } from 'app/constants/empty-configs';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { emptyConfigIcon } from 'app/helpers/empty-config.helper';
import { tapOnce } from 'app/helpers/operators/tap-once.operator';
import { CloudBackup } from 'app/interfaces/cloud-backup.interface';
import { Job } from 'app/interfaces/job.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import {
  dataProviderEmptyState, dataProviderLoading, dataProviderRows, mapTnSortToTableSort, perRow, rowTestIdTag,
} from 'app/modules/ix-table/utils';
import { LoaderService } from 'app/modules/loader/loader.service';
import { FlattenEmptyMessagePipe } from 'app/modules/pipes/flatten-empty-message/flatten-empty-message.pipe';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TableActionsCellComponent } from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import {
  TableRelativeDateCellComponent,
} from 'app/modules/tn-table-cells/relative-date-cell/table-relative-date-cell.component';
import { TableToggleCellComponent } from 'app/modules/tn-table-cells/toggle-cell/table-toggle-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { CloudBackupFormComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-form/cloud-backup-form.component';
import { cloudBackupListElements } from 'app/pages/data-protection/cloud-backup/cloud-backup-list/cloud-backup-list.elements';
import {
  TaskStateCellComponent,
} from 'app/pages/data-protection/components/task-state-cell/task-state-cell.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-cloud-backup-list',
  templateUrl: './cloud-backup-list.component.html',
  styleUrl: './cloud-backup-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    UiSearchDirective,
    BasicSearchComponent,
    TnEmptyComponent,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnTestIdDirective,
    TnTooltipDirective,
    TnTablePagerComponent,
    TableActionsCellComponent,
    TableRelativeDateCellComponent,
    TableToggleCellComponent,
    TaskStateCellComponent,
    YesNoPipe,
    FlattenEmptyMessagePipe,
    TranslateModule,
  ],
})
export class CloudBackupListComponent {
  private cdr = inject(ChangeDetectorRef);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private formPanel = inject(FormSidePanelService);
  private dialogService = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);
  private snackbar = inject(SnackbarService);
  private loader = inject(LoaderService);
  private destroyRef = inject(DestroyRef);
  private emptyService = inject(EmptyService);

  readonly dataProvider = input.required<AsyncDataProvider<CloudBackup>>();
  readonly cloudBackups = input<CloudBackup[]>([]);

  readonly toggleShowMobileDetails = output<boolean>();
  readonly searchQuery = signal<string>('');
  protected readonly requiredRoles = [Role.CloudBackupWrite];
  protected readonly searchableElements = cloudBackupListElements;

  protected readonly rows = dataProviderRows(this.dataProvider);
  protected readonly isLoading = dataProviderLoading(this.dataProvider);
  protected readonly empty = dataProviderEmptyState(this.dataProvider);

  // Bound from the shared catalog configs rather than inlined in the template, so the
  // translated strings have a single source of truth and follow a language change.
  // Unlike the other migrated lists, both empty branches are rendered above the table
  // (the page-level `@if` covers search and no-data alike), so the table itself never
  // shows an empty state and takes no `[emptyMessage]`/`[emptyIcon]`.
  protected readonly emptyConfig = cloudBackupTaskEmptyConfig;
  protected readonly noSearchResultsConfig = noSearchResultsConfig;

  // Icons split out of the same configs rather than hand-copied into the template, so
  // the catalog stays the single source of truth for the icon as well as the message.
  // The no-search-results config carries no icon of its own — that state's icon belongs
  // to the empty *type*, so it comes from the type mapping. Keyed on the config's own
  // type rather than the provider's: this branch renders whenever a search matched
  // nothing, including on a list that was empty to begin with.
  protected readonly emptyIcon = emptyConfigIcon(cloudBackupTaskEmptyConfig);
  protected readonly noSearchResultsIcon = emptyConfigIcon(
    noSearchResultsConfig,
    this.emptyService.iconForType(noSearchResultsConfig.type),
  );

  protected readonly displayedColumns = ['description', 'enabled', 'snapshot', 'state', 'last-run', 'actions'];

  protected readonly actions: IconActionConfig<CloudBackup>[] = [
    {
      iconName: tnIconMarker('pencil', 'mdi'),
      tooltip: this.translate.instant('Edit'),
      onClick: (row) => this.openForm(row),
    },
    {
      iconName: tnIconMarker('play-circle', 'mdi'),
      tooltip: this.translate.instant('Run job'),
      hidden: (row) => of(row.job?.state === JobState.Running),
      onClick: (row) => this.runNow(row),
      requiredRoles: this.requiredRoles,
    },
    {
      iconName: tnIconMarker('delete', 'mdi'),
      tooltip: this.translate.instant('Delete'),
      onClick: (row) => this.doDelete(row),
      requiredRoles: this.requiredRoles,
    },
  ];

  protected readonly trackByBackupId = (_index: number, row: CloudBackup): number => row.id;

  protected readonly uniqueRowTag = rowTestIdTag<CloudBackup>((row) => 'cloud-backup-' + row.description);

  protected readonly ariaLabel = perRow<CloudBackup, string>(
    (row) => [row.description, this.translate.instant('Cloud Backup')].join(' '),
  );

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider().setSorting(mapTnSortToTableSort<CloudBackup>(event, this.displayedColumns));
  }

  /**
   * `tn-table` matches the active row by object identity, but `expandedRow` can hold a
   * copy (a finished job replaces it with a spread of the row to re-trigger the detail
   * pane), so resolve back to the reference actually rendered in the table.
   */
  protected activeRow(): CloudBackup | null {
    const expanded = this.dataProvider().expandedRow;
    if (!expanded) {
      return null;
    }
    return this.rows().find((backup) => backup.id === expanded.id) ?? null;
  }

  protected onRowClick(row: CloudBackup): void {
    const provider = this.dataProvider();
    const isSameRow = provider.expandedRow?.id === row.id;
    provider.expandedRow = isSameRow ? null : row;

    if (provider.expandedRow) {
      this.toggleShowMobileDetails.emit(true);
    }

    this.cdr.markForCheck();
  }

  constructor() {
    effect(() => {
      if (!this.cloudBackups().length) {
        this.dataProvider().expandedRow = null;
        this.cdr.markForCheck();
      }
    });
  }

  private runNow(row: CloudBackup): void {
    this.dialogService.confirm({
      title: this.translate.instant('Run Now'),
      message: this.translate.instant('Run «{name}» Cloud Backup Task now?', { name: row.description }),
      hideCheckbox: true,
    }).pipe(
      filter(Boolean),
      tap(() => this.updateRowJob(row, { ...row.job, state: JobState.Running })),
      tapOnce(() => {
        this.snackbar.success(this.translate.instant('Cloud Backup Task «{name}» has started.', { name: row.description }));
      }),
      switchMap(() => this.api.job('cloud_backup.sync', [row.id])),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (job: Job) => {
        if (job.state === JobState.Success) {
          this.snackbar.success(this.translate.instant('Cloud Backup Task «{name}» completed successfully.', { name: row.description }));
        }
        this.updateRowJob(row, job);
        // Update expanded row to call child ngOnChanges method & update snapshots list
        if (
          (job.state === JobState.Success)
          && this.dataProvider().expandedRow?.id === row.id
        ) {
          this.dataProvider().expandedRow = { ...row };
        }
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.errorHandler.showErrorModal(error);
        this.dataProvider().load();
      },
    });
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataProvider().setFilter({ query, columnKeys: ['description'] });
  }

  // CloudBackupFormComponent structurally provides the host surface (closed/canSubmit/submit/
  // hasUnsavedChanges/requiredRoles) the panel reads; cast past the nominal base type.
  private readonly cloudBackupForm = CloudBackupFormComponent as unknown as Type<SidePanelForm>;

  protected openForm(row?: CloudBackup): void {
    this.formPanel.open(this.cloudBackupForm, {
      title: row
        ? this.translate.instant('Edit TrueCloud Backup Task')
        : this.translate.instant('Add TrueCloud Backup Task'),
      wide: true,
      inputs: { backupToEdit: row },
    }).onSuccess(() => this.dataProvider().load(), this.destroyRef);
  }

  private doDelete(row: CloudBackup): void {
    this.dialogService.confirmDelete({
      title: this.translate.instant('Confirmation'),
      message: this.translate.instant('Delete Cloud Backup Task <b>"{name}"</b>?', {
        name: row.description,
      }),
      call: () => this.api.call('cloud_backup.delete', [row.id]),
      successMessage: this.translate.instant('Cloud Backup Task «{name}» deleted.', { name: row.description }),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.dataProvider().load());
  }

  protected onChangeEnabledState(cloudBackup: CloudBackup, toggle: TableToggleCellComponent): void {
    this.api
      .call('cloud_backup.update', [cloudBackup.id, { enabled: !cloudBackup.enabled }])
      .pipe(this.loader.withLoader(), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.dataProvider().load(),
        error: (error: unknown) => {
          toggle.revert();
          this.dataProvider().load();
          this.errorHandler.showErrorModal(error);
        },
      });
  }

  private updateRowJob(row: CloudBackup, job: Job): void {
    const backups = this.cloudBackups().map((backup) => (backup.id === row.id ? { ...backup, job } : backup));
    this.dataProvider().setRows(backups);
  }
}
