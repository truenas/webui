import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  tnIconMarker, TnButtonComponent, TnCardComponent, TnCardHeaderActionsDirective,
  TnCellDefDirective, TnDialog, TnEmptyComponent, TnHeaderCellDefDirective,
  TnTableColumnDirective, TnTableComponent, TnTablePagerComponent, TnTestIdDirective,
  type TnSortEvent,
} from '@truenas/ui-components';
import { filter, switchMap, tap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { s3AccessKeyStatusLabels } from 'app/enums/s3.enum';
import { formatDistanceToNowShortened } from 'app/helpers/format-distance-to-now-shortened';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { S3AccessKey } from 'app/interfaces/s3.interface';
import { IxDateComponent } from 'app/modules/dates/pipes/ix-date/ix-date.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { AsyncDataProvider } from 'app/modules/tn-table/classes/async-data-provider/async-data-provider';
import { actionsColumn, column } from 'app/modules/tn-table/column-configs';
import { TableColumnPickerComponent } from 'app/modules/tn-table/components/table-column-picker/table-column-picker.component';
import { SortDirection } from 'app/modules/tn-table/enums/sort-direction.enum';
import { IconActionConfig } from 'app/modules/tn-table/interfaces/icon-action-config.interface';
import {
  createTable, dataProviderLoading, dataProviderRows, mapTnSortToTableSort, toDisplayedColumns, toUniqueRowTag,
} from 'app/modules/tn-table/utils';
import { TableActionsCellComponent } from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  S3AccessKeyCredentialsDialogComponent,
} from 'app/pages/credentials/s3-access-keys/s3-access-key-credentials-dialog/s3-access-key-credentials-dialog.component';
import { S3AccessKeyFormComponent } from 'app/pages/credentials/s3-access-keys/s3-access-key-form/s3-access-key-form.component';
import { s3AccessKeyListElements } from 'app/pages/credentials/s3-access-keys/s3-access-key-list/s3-access-key-list.elements';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-s3-access-key-list',
  templateUrl: './s3-access-key-list.component.html',
  styleUrls: ['./s3-access-key-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
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
    TableActionsCellComponent,
    TnTablePagerComponent,
    IxDateComponent,
    YesNoPipe,
    TranslateModule,
  ],
})
export class S3AccessKeyListComponent implements OnInit {
  private loader = inject(LoaderService);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private dialog = inject(DialogService);
  private tnDialog = inject(TnDialog);
  private snackbar = inject(SnackbarService);
  private errorHandler = inject(ErrorHandlerService);
  private formPanel = inject(FormSidePanelService);
  protected emptyService = inject(EmptyService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.SharingS3Write, Role.SharingWrite];
  protected readonly searchableElements = s3AccessKeyListElements;
  protected readonly EmptyType = EmptyType;

  protected readonly searchQuery = signal('');

  private readonly keys$ = this.api.call('s3.accesskey.query').pipe(
    tap((keys) => this.accessKeys = keys),
    takeUntilDestroyed(this.destroyRef),
  );

  protected readonly dataProvider = new AsyncDataProvider<S3AccessKey>(this.keys$);
  protected readonly rows = dataProviderRows(this.dataProvider);
  protected readonly isLoading = dataProviderLoading(this.dataProvider);
  protected readonly emptyType = toSignal(this.dataProvider.emptyType$);
  protected readonly currentPageCount = toSignal(this.dataProvider.currentPageCount$);

  private accessKeys: S3AccessKey[] = [];

  protected readonly actions: IconActionConfig<S3AccessKey>[] = [
    {
      iconName: tnIconMarker('pencil', 'mdi'),
      tooltip: this.translate.instant('Edit'),
      onClick: (row) => this.doEdit(row),
    },
    {
      iconName: tnIconMarker('refresh', 'mdi'),
      tooltip: this.translate.instant('Rotate Secret'),
      onClick: (row) => this.doRotate(row),
      requiredRoles: this.requiredRoles,
    },
    {
      iconName: tnIconMarker('delete', 'mdi'),
      tooltip: this.translate.instant('Delete'),
      onClick: (row) => this.doDelete(row),
      requiredRoles: this.requiredRoles,
    },
  ];

  protected readonly columns = signal(createTable<S3AccessKey>([
    column({
      title: this.translate.instant('Name'),
      propertyName: 'name',
    }),
    column({
      title: this.translate.instant('User'),
      propertyName: 'username',
    }),
    column({
      title: this.translate.instant('Access Key ID'),
      propertyName: 'access_key',
    }),
    column({
      title: this.translate.instant('Status'),
      propertyName: 'status',
    }),
    column({
      title: this.translate.instant('Expires On'),
      propertyName: 'expires_at',
    }),
    column({
      title: this.translate.instant('Last Used'),
      propertyName: 'last_used_at',
    }),
    column({
      title: this.translate.instant('Manage Buckets'),
      propertyName: 'manage_buckets',
      hidden: true,
    }),
    column({
      title: this.translate.instant('Created'),
      propertyName: 'created_at',
      hidden: true,
    }),
    actionsColumn(),
  ]));

  protected readonly displayedColumns = computed<string[]>(() => toDisplayedColumns(this.columns()));

  protected readonly trackByKeyId = (_index: number, row: S3AccessKey): number => row.id;

  protected uniqueRowTag(row: S3AccessKey): string {
    return toUniqueRowTag('s3-access-key-' + row.name);
  }

  protected ariaLabel(row: S3AccessKey): string {
    return [row.name, this.translate.instant('S3 Access Key')].join(' ');
  }

  protected usernameLabel(row: S3AccessKey): string {
    return row.username ?? this.translate.instant('Missing');
  }

  protected statusLabel(row: S3AccessKey): string {
    return this.translate.instant(s3AccessKeyStatusLabels.get(row.status) || row.status);
  }

  protected expiresLabel(row: S3AccessKey): string {
    return this.relativeOrNever(row.expires_at);
  }

  /** The S3 service reports usage at intervals, so a recent request can lag here for a short time. */
  protected lastUsedLabel(row: S3AccessKey): string {
    return this.relativeOrNever(row.last_used_at);
  }

  private relativeOrNever(timestamp: ApiTimestamp | null): string {
    return timestamp?.$date
      ? formatDistanceToNowShortened(timestamp.$date)
      : this.translate.instant('Never');
  }

  ngOnInit(): void {
    this.dataProvider.setSorting({
      active: 0,
      direction: SortDirection.Asc,
      propertyName: 'name',
    });
    this.dataProvider.emptyType$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.onListFiltered(this.searchQuery());
    });
    this.refresh();
  }

  protected doAdd(): void {
    this.formPanel.open(S3AccessKeyFormComponent, {
      title: this.translate.instant('Add S3 Access Key'),
      inputs: { accessKey: undefined },
    }).onSuccess(() => this.refresh(), this.destroyRef);
  }

  protected doEdit(key: S3AccessKey): void {
    this.formPanel.open(S3AccessKeyFormComponent, {
      title: this.translate.instant('Edit S3 Access Key'),
      inputs: { accessKey: key },
    }).onSuccess(() => this.refresh(), this.destroyRef);
  }

  protected doRotate(key: S3AccessKey): void {
    this.dialog.confirm({
      title: this.translate.instant('Rotate secret for "{name}"?', { name: key.name }),
      message: this.translate.instant(
        'A new secret access key is generated under the same access key ID and shown once.<br><br>Clients using the current secret will stop working.',
      ),
      buttonText: this.translate.instant('Rotate'),
      buttonColor: 'warn',
    }).pipe(
      filter(Boolean),
      switchMap(() => this.api.call('s3.accesskey.update', [key.id, { rotate: true }]).pipe(this.loader.withLoader())),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (rotated) => {
        this.snackbar.success(this.translate.instant('Secret access key rotated'));
        this.refresh();
        this.tnDialog.open(S3AccessKeyCredentialsDialogComponent, { data: rotated });
      },
      error: (error: unknown) => this.errorHandler.showErrorModal(error),
    });
  }

  protected doDelete(key: S3AccessKey): void {
    this.dialog.confirmDelete({
      title: this.translate.instant('Delete S3 access key "{name}"?', { name: key.name }),
      message: this.translate.instant('Clients signing requests with this key will be refused.'),
      call: () => this.api.call('s3.accesskey.delete', [key.id]),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.refresh());
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(
      mapTnSortToTableSort<S3AccessKey>(event, this.displayedColumns(), { columns: this.columns() }),
    );
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataProvider.setFilter({
      query,
      columnKeys: !this.accessKeys.length ? [] : ['name', 'username', 'access_key'],
    });
  }

  protected onColumnsChange(columns: ReturnType<typeof this.columns>): void {
    this.columns.set([...columns]);
  }

  private refresh(): void {
    this.dataProvider.load();
  }
}
