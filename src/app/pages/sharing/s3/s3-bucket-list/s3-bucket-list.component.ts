import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  tnIconMarker, TnButtonComponent, TnCardComponent, TnCardHeaderActionsDirective, TnCardHeaderDirective,
  TnCellDefDirective, TnEmptyComponent, TnHeaderCellDefDirective,
  TnTableColumnDirective, TnTableComponent, TnTablePagerComponent, TnTestIdDirective, TnTooltipDirective,
  type TnSortEvent,
} from '@truenas/ui-components';
import { tap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { s3ObjectOwnershipLabels, s3PermissionsModelLabels, s3VersioningLabels } from 'app/enums/s3.enum';
import { helptextSharingS3 } from 'app/helptext/sharing';
import { S3Bucket } from 'app/interfaces/s3.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { AsyncDataProvider } from 'app/modules/tn-table/classes/async-data-provider/async-data-provider';
import { actionsColumn, column } from 'app/modules/tn-table/column-configs';
import { TableColumnPickerComponent } from 'app/modules/tn-table/components/table-column-picker/table-column-picker.component';
import { SortDirection } from 'app/modules/tn-table/enums/sort-direction.enum';
import { IconActionConfig } from 'app/modules/tn-table/interfaces/icon-action-config.interface';
import {
  createTable, dataProviderLoading, dataProviderRows, mapTnSortToTableSort, toDisplayedColumns, toUniqueRowTag,
} from 'app/modules/tn-table/utils';
import { TableActionsCellComponent } from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import { TableToggleCellComponent } from 'app/modules/tn-table-cells/toggle-cell/table-toggle-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { S3BucketFormComponent } from 'app/pages/sharing/s3/s3-bucket-form/s3-bucket-form.component';
import { s3BucketListElements } from 'app/pages/sharing/s3/s3-bucket-list/s3-bucket-list.elements';
import { bucketToShareRow } from 'app/pages/sharing/s3/utils/s3-bucket.utils';
import { getUnavailableReason, isShareUnavailable } from 'app/pages/sharing/utils/share-exported-pool.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { poolStore } from 'app/services/global-store/stores.constant';

@Component({
  selector: 'ix-s3-bucket-list',
  templateUrl: './s3-bucket-list.component.html',
  styleUrls: ['./s3-bucket-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardHeaderDirective,
    TnCardHeaderActionsDirective,
    BasicSearchComponent,
    TableColumnPickerComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    TnTestIdDirective,
    RouterLink,
    UiSearchDirective,
    TnEmptyComponent,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TableToggleCellComponent,
    TableActionsCellComponent,
    TnTablePagerComponent,
    TnTooltipDirective,
    TranslateModule,
    YesNoPipe,
  ],
})
export class S3BucketListComponent implements OnInit {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private dialog = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);
  private formPanel = inject(FormSidePanelService);
  protected emptyService = inject(EmptyService);
  private destroyRef = inject(DestroyRef);
  private poolStoreService = inject(poolStore);

  protected readonly requiredRoles = [Role.SharingS3Write, Role.SharingWrite];
  protected readonly searchableElements = s3BucketListElements;
  protected readonly EmptyType = EmptyType;

  protected readonly searchQuery = signal('');

  private readonly buckets$ = this.api.call('sharing.s3.query').pipe(
    tap((buckets) => this.buckets = buckets),
    takeUntilDestroyed(this.destroyRef),
  );

  protected readonly dataProvider = new AsyncDataProvider<S3Bucket>(this.buckets$);
  protected readonly rows = dataProviderRows(this.dataProvider);
  protected readonly isLoading = dataProviderLoading(this.dataProvider);
  protected readonly emptyType = toSignal(this.dataProvider.emptyType$);
  protected readonly currentPageCount = toSignal(this.dataProvider.currentPageCount$);

  private buckets: S3Bucket[] = [];
  /** null = pools not yet loaded; string[] once pool.query completes */
  private activePoolPaths = signal<string[] | null>(null);

  protected readonly actions: IconActionConfig<S3Bucket>[] = [
    {
      iconName: tnIconMarker('pencil', 'mdi'),
      tooltip: this.translate.instant('Edit'),
      onClick: (row) => this.doEdit(row),
    },
    {
      iconName: tnIconMarker('delete', 'mdi'),
      tooltip: this.translate.instant('Delete'),
      onClick: (row) => {
        this.dialog.confirmDelete({
          title: this.translate.instant('Delete S3 bucket "{name}"?', { name: row.name }),
          message: this.translate.instant(helptextSharingS3.deleteBucketMessage),
          call: () => this.api.call('sharing.s3.delete', [row.id]),
        }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.refresh());
      },
      requiredRoles: this.requiredRoles,
    },
  ];

  // Column model retained purely to drive <ix-table-column-picker>; tn-table renders
  // cells from the template and derives `displayedColumns` from these.
  protected readonly columns = signal(createTable<S3Bucket>([
    column({
      title: this.translate.instant('Name'),
      propertyName: 'name',
    }),
    column({
      title: this.translate.instant('Dataset'),
      propertyName: 'dataset',
    }),
    column({
      title: this.translate.instant('Owner'),
      propertyName: 'owner',
    }),
    column({
      title: this.translate.instant('Permissions Model'),
      propertyName: 'permissions_model',
      sortBy: (row) => this.permissionsModelLabel(row),
    }),
    column({
      title: this.translate.instant('Object Ownership'),
      propertyName: 'object_ownership',
      sortBy: (row) => this.objectOwnershipLabel(row),
      hidden: true,
    }),
    column({
      title: this.translate.instant('Versioning'),
      propertyName: 'versioning',
      // Sort on the label the cell shows, not the raw enum, so the order matches the visible text.
      sortBy: (row) => this.versioningLabel(row),
    }),
    column({
      title: this.translate.instant('Object Lock'),
      propertyName: 'object_lock',
    }),
    column({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
    }),
    actionsColumn(),
  ]));

  protected readonly displayedColumns = computed<string[]>(() => toDisplayedColumns(this.columns()));

  protected readonly trackByBucketId = (_index: number, row: S3Bucket): number => row.id;

  protected uniqueRowTag(row: S3Bucket): string {
    return toUniqueRowTag('s3-bucket-' + row.name);
  }

  protected ariaLabel(row: S3Bucket): string {
    return [row.name, this.translate.instant('S3 Bucket')].join(' ');
  }

  protected permissionsModelLabel(row: S3Bucket): string {
    return this.translate.instant(s3PermissionsModelLabels.get(row.permissions_model) || row.permissions_model);
  }

  protected objectOwnershipLabel(row: S3Bucket): string {
    return this.translate.instant(s3ObjectOwnershipLabels.get(row.object_ownership) || row.object_ownership);
  }

  protected versioningLabel(row: S3Bucket): string {
    return this.translate.instant(s3VersioningLabels.get(row.versioning) || row.versioning);
  }

  protected isToggleDisabled(row: S3Bucket): boolean {
    return isShareUnavailable(bucketToShareRow(row), this.activePoolPaths());
  }

  protected getEnabledTooltip(row: S3Bucket): string {
    return this.isToggleDisabled(row)
      ? this.translate.instant(getUnavailableReason(bucketToShareRow(row), this.activePoolPaths()))
      : '';
  }

  ngOnInit(): void {
    this.setDefaultSort();
    this.dataProvider.emptyType$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.onListFiltered(this.searchQuery());
    });

    this.poolStoreService.call.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (pools) => {
        this.activePoolPaths.set(pools.map((pool) => pool.path));
        this.refresh();
      },
      error: () => {
        this.refresh();
      },
    });
  }

  private setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 0,
      direction: SortDirection.Asc,
      propertyName: 'name',
    });
  }

  protected doAdd(): void {
    this.formPanel.open(S3BucketFormComponent, {
      title: this.translate.instant('Add S3 Bucket'),
      inputs: { bucket: undefined },
    }).onSuccess(() => this.refresh(), this.destroyRef);
  }

  protected doEdit(row: S3Bucket): void {
    this.formPanel.open(S3BucketFormComponent, {
      title: this.translate.instant('Edit S3 Bucket'),
      inputs: { bucket: row },
    }).onSuccess(() => this.refresh(), this.destroyRef);
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(
      mapTnSortToTableSort<S3Bucket>(event, this.displayedColumns(), { columns: this.columns() }),
    );
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataProvider.setFilter({
      query,
      columnKeys: !this.buckets.length ? [] : ['name', 'dataset', 'owner'],
    });
  }

  protected onColumnsChange(columns: ReturnType<typeof this.columns>): void {
    this.columns.set([...columns]);
  }

  private refresh(): void {
    this.dataProvider.load();
  }

  protected onChangeEnabledState(row: S3Bucket, toggle: TableToggleCellComponent): void {
    this.api.call('sharing.s3.update', [row.id, { enabled: !row.enabled }]).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.dataProvider.load();
      },
      error: (error: unknown) => {
        // A reload re-emits the unchanged row, so the optimistic flip has to be undone on the cell itself.
        toggle.revert();
        this.errorHandler.showErrorModal(error);
      },
    });
  }
}
