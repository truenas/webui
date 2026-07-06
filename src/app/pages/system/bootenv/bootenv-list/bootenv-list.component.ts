import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent,
  TnCellDefDirective,
  TnDialog,
  TnEmptyComponent,
  TnHeaderCellDefDirective,
  TnSortEvent,
  TnTableColumnDirective,
  TnTableComponent,
  TnTablePagerComponent,
  tnIconMarker,
} from '@truenas/ui-components';
import { filter, of, switchMap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { helptextSystemBootenv } from 'app/helptext/system/boot-env';
import { BootEnvironment } from 'app/interfaces/boot-environment.interface';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { mapTnSortToTableSort } from 'app/modules/ix-table/utils';
import { LoaderService } from 'app/modules/loader/loader.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TableActionsCellComponent } from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { BootPoolDeleteDialog } from 'app/pages/system/bootenv/boot-pool-delete-dialog/boot-pool-delete-dialog.component';
import { getBootenvFormConfig } from 'app/pages/system/bootenv/bootenv-form/bootenv.form-config';
import { bootListElements } from 'app/pages/system/bootenv/bootenv-list/bootenv-list.elements';
import { BootenvStatsDialog } from 'app/pages/system/bootenv/bootenv-stats-dialog/bootenv-stats-dialog.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-bootenv-list',
  templateUrl: './bootenv-list.component.html',
  styleUrls: ['./bootenv-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    BasicSearchComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    UiSearchDirective,
    RouterLink,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnEmptyComponent,
    TnTablePagerComponent,
    TableActionsCellComponent,
    FormatDateTimePipe,
    FileSizePipe,
    YesNoPipe,
    TranslateModule,
    AsyncPipe,
  ],
})
export class BootEnvironmentListComponent implements OnInit {
  private api = inject(ApiService);
  private tnDialog = inject(TnDialog);
  private translate = inject(TranslateService);
  private formPanel = inject(FormSidePanelService);
  private loader = inject(LoaderService);
  private dialogService = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);
  private snackbar = inject(SnackbarService);
  protected emptyService = inject(EmptyService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.BootEnvWrite];
  protected readonly searchableElements = bootListElements;
  protected dataProvider: AsyncDataProvider<BootEnvironment>;
  protected readonly searchQuery = signal('');

  protected readonly displayedColumns = ['id', 'active', 'created', 'used_bytes', 'keep', 'actions'];

  protected readonly trackByBootenvId = (_: number, row: BootEnvironment): string => row.id;

  private readonly tnTable = viewChild(TnTableComponent);

  protected readonly selectedBootenvs = signal<BootEnvironment[]>([]);

  protected readonly selectionHasItems = computed(() => {
    return this.selectedBootenvs().some((bootenv) => !bootenv.active && !bootenv.activated);
  });

  protected readonly actions: IconActionConfig<BootEnvironment>[] = [
    {
      iconName: tnIconMarker('check-decagram', 'mdi'),
      requiredRoles: this.requiredRoles,
      tooltip: this.translate.instant('Activate'),
      hidden: (row) => of(!row.can_activate || row.activated),
      onClick: (row) => this.doActivate(row),
    },
    {
      iconName: tnIconMarker('bookmark-outline', 'mdi'),
      requiredRoles: this.requiredRoles,
      tooltip: this.translate.instant('Keep'),
      hidden: (row) => of(row.keep),
      onClick: (row) => this.toggleKeep(row),
    },
    {
      iconName: tnIconMarker('bookmark', 'mdi'),
      requiredRoles: this.requiredRoles,
      tooltip: this.translate.instant('Unkeep'),
      hidden: (row) => of(!row.keep),
      onClick: (row) => this.toggleKeep(row),
    },
    {
      iconName: tnIconMarker('content-copy', 'mdi'),
      requiredRoles: this.requiredRoles,
      tooltip: this.translate.instant('Clone'),
      onClick: (row) => this.doClone(row),
    },
    {
      iconName: tnIconMarker('delete', 'mdi'),
      requiredRoles: this.requiredRoles,
      tooltip: this.translate.instant('Delete'),
      hidden: (row) => of(row.active || row.activated),
      onClick: (row) => this.doDelete([row]),
    },
  ];

  ngOnInit(): void {
    this.dataProvider = new AsyncDataProvider(this.api.call('boot.environment.query'));
    this.refresh();
    this.setDefaultSort();
    this.dataProvider.emptyType$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.onListFiltered(this.searchQuery());
    });
  }

  protected activeLabel(row: BootEnvironment): string {
    if (row.active) {
      return this.translate.instant('Now');
    }
    if (row.activated) {
      return this.translate.instant('Restart');
    }
    return this.translate.instant('No');
  }

  protected uniqueRowTag(row: BootEnvironment): string {
    return `bootenv-${row.id}`;
  }

  protected ariaLabel(row: BootEnvironment): string {
    return [row.id, this.translate.instant('Boot Environment')].join(' ');
  }

  protected handleSlideInClosed(result$: SlideInResult<boolean>): void {
    result$.onSuccess(() => this.refresh(), this.destroyRef);
  }

  protected openBootenvStats(): void {
    this.tnDialog.open(BootenvStatsDialog);
  }

  protected doClone(bootenv: BootEnvironment): void {
    const result$ = this.formPanel.openForm(getBootenvFormConfig(this.api, this.translate, bootenv.id), {
      title: this.translate.instant('Clone Boot Environment'),
    });
    this.handleSlideInClosed(result$);
  }

  protected doScrub(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Scrub'),
      message: this.translate.instant('Start the scrub now?'),
      buttonText: this.translate.instant('Start Scrub'),
    }).pipe(
      filter(Boolean),
      switchMap(() => {
        return this.api.startJob('boot.scrub').pipe(
          this.loader.withLoader(),
          this.errorHandler.withErrorHandler(),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.snackbar.success(this.translate.instant('Scrub Started'));
    });
  }

  protected doDelete(bootenvs: BootEnvironment[]): void {
    const data = bootenvs.filter((bootenv) => !bootenv.active && !bootenv.activated);
    this.tnDialog.open(BootPoolDeleteDialog, { data })
      .closed
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.refresh();
      });
  }

  private doActivate(bootenv: BootEnvironment): void {
    this.dialogService.confirm({
      title: this.translate.instant('Activate'),
      message: this.translate.instant('Activate this Boot Environment?'),
      buttonText: this.translate.instant(helptextSystemBootenv.activateButton),
    }).pipe(
      filter(Boolean),
      switchMap(() => {
        return this.api.call('boot.environment.activate', [{ id: bootenv.id }]).pipe(
          this.loader.withLoader(),
          this.errorHandler.withErrorHandler(),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.refresh());
  }

  private toggleKeep(bootenv: BootEnvironment): void {
    if (!bootenv.keep) {
      this.dialogService.confirm({
        title: this.translate.instant('Keep'),
        message: this.translate.instant('Keep this Boot Environment?'),
        buttonText: this.translate.instant('Set Keep Flag'),
      }).pipe(
        filter(Boolean),
        switchMap(() => {
          return this.api.call('boot.environment.keep', [{ id: bootenv.id, value: true }]).pipe(
            this.loader.withLoader(),
            this.errorHandler.withErrorHandler(),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe(() => this.refresh());
    } else {
      this.dialogService.confirm({
        title: this.translate.instant('Unkeep'),
        message: this.translate.instant('No longer keep this Boot Environment?'),
        buttonText: this.translate.instant('Remove Keep Flag'),
      }).pipe(
        filter(Boolean),
        switchMap(() => {
          return this.api.call('boot.environment.keep', [{ id: bootenv.id, value: false }]).pipe(
            this.loader.withLoader(),
            this.errorHandler.withErrorHandler(),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe(() => this.refresh());
    }
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataProvider.setFilter({ query, columnKeys: ['id'] });
  }

  protected onSelectionChange(bootenvs: BootEnvironment[]): void {
    this.selectedBootenvs.set(bootenvs);
  }

  protected onSortChange(event: TnSortEvent): void {
    const sorting = mapTnSortToTableSort<BootEnvironment>(event, this.displayedColumns);
    if (sorting.propertyName === 'created') {
      sorting.sortBy = (row) => row.created.$date;
    }
    this.dataProvider.setSorting(sorting);
  }

  private setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 2,
      direction: SortDirection.Desc,
      propertyName: 'created',
      sortBy: (row) => row.created.$date,
    });
  }

  private refresh(): void {
    this.tnTable()?.selection.clear();
    this.selectedBootenvs.set([]);
    this.dataProvider.load();
  }
}
