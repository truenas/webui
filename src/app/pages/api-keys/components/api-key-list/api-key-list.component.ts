import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { combineLatest, Observable, of } from 'rxjs';
import {
  filter, map, switchMap, tap,
} from 'rxjs/operators';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { ApiKey } from 'app/interfaces/api-key.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { dateColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-date/ix-cell-date.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { ApiKeyFormDialogComponent } from 'app/pages/api-keys/components/api-key-form-dialog/api-key-form-dialog.component';
import { apiKeysElements } from 'app/pages/api-keys/components/api-key-list/api-key-list.elements';
import { ApiKeyComponentStore } from 'app/pages/api-keys/store/api-key.store';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-api-key-list',
  templateUrl: './api-key-list.component.html',
  styleUrls: ['./api-key-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApiKeyListComponent implements OnInit {
  protected readonly requiredRoles = [Role.FullAdmin];
  protected readonly searchableElements = apiKeysElements;

  dataProvider = new ArrayDataProvider<ApiKey>();
  apiKeys: ApiKey[] = [];
  filterString = '';

  columns = createTable<ApiKey>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
    }),
    dateColumn({
      title: this.translate.instant('Created Date'),
      getValue: (row) => row.created_at.$date,
    }),
    actionsColumn({
      actions: [
        {
          iconName: 'edit',
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.openApiKeyForm(row),
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
    rowTestId: (row) => 'api-key-' + row.name + '-' + row.created_at.$date,
    ariaLabels: (row) => [row.name, this.translate.instant('Api Key')],
  });

  isLoading$ = this.store.isLoading$;
  emptyType$: Observable<EmptyType> = combineLatest([
    this.store.isLoading$,
    this.store.isError$,
    this.store.apiKeys$.pipe(map((apiKeys) => apiKeys?.length === 0)),
  ]).pipe(
    switchMap(([isLoading, isError, isNoData]) => {
      switch (true) {
        case isLoading:
          return of(EmptyType.Loading);
        case !!isError:
          return of(EmptyType.Errors);
        case isNoData:
          return of(EmptyType.NoPageData);
        default:
          return of(EmptyType.NoSearchResults);
      }
    }),
  );

  get emptyConfigService(): EmptyService {
    return this.emptyService;
  }

  constructor(
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private store: ApiKeyComponentStore,
    private matDialog: MatDialog,
    private dialog: DialogService,
    private ws: WebSocketService,
    private emptyService: EmptyService,
    private errorHandler: ErrorHandlerService,
    private loader: AppLoaderService,
  ) { }

  ngOnInit(): void {
    this.getApiKeys();
    this.setDefaultSort();
  }

  onListFiltered(query: string): void {
    this.filterString = query.toLowerCase();
    this.dataProvider.setFilter({ list: this.apiKeys, query, columnKeys: ['name'] });
  }

  openApiKeyForm(row?: ApiKey): void {
    this.matDialog
      .open(ApiKeyFormDialogComponent, { data: row })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  private getApiKeys(): void {
    this.store.loadApiKeys();
    this.store.apiKeys$.pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (apiKeys) => {
        this.apiKeys = apiKeys;
        this.onListFiltered(this.filterString);
        this.cdr.markForCheck();
      },
      error: () => {
        this.apiKeys = [];
        this.dataProvider.setRows(this.apiKeys);
        this.cdr.markForCheck();
      },
    });
  }

  private doDelete(apiKey: ApiKey): void {
    this.dialog.confirm({
      title: this.translate.instant('Delete API Key'),
      message: this.translate.instant('Are you sure you want to delete the <b>{name}</b> API Key?', { name: apiKey.name }),
      buttonText: this.translate.instant('Delete'),
      cancelText: this.translate.instant('Cancel'),
    }).pipe(
      filter(Boolean),
      tap(() => this.loader.open()),
      switchMap(() => this.ws.call('api_key.delete', [String(apiKey.id)])),
      untilDestroyed(this),
    ).subscribe({
      next: () => this.store.apiKeyDeleted(apiKey.id),
      error: (error) => {
        this.errorHandler.showErrorModal(error);
        this.loader.close();
      },
      complete: () => this.loader.close(),
    });
  }

  private setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 1,
      direction: SortDirection.Asc,
      propertyName: 'name',
    });
  }
}
