import { AsyncPipe } from '@angular/common';
import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { MatAnchor, MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { combineLatest, Observable, of } from 'rxjs';
import {
  filter, map, switchMap, tap,
} from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { ApiKey } from 'app/interfaces/api-key.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { dateColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-date/ix-cell-date.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { apiKeysElements } from 'app/pages/api-keys/api-keys.elements';
import { ApiKeyFormDialogComponent } from 'app/pages/api-keys/components/api-key-form-dialog/api-key-form-dialog.component';
import { ApiKeyComponentStore } from 'app/pages/api-keys/store/api-key.store';
import { WebSocketService } from 'app/services/api.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-api-keys',
  templateUrl: './api-keys.component.html',
  styleUrls: ['./api-keys.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    SearchInput1Component,
    MatAnchor,
    TestDirective,
    RequiresRolesDirective,
    MatButton,
    IxTableComponent,
    UiSearchDirective,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTablePagerComponent,
    TranslateModule,
    AsyncPipe,
    PageHeaderComponent,
  ],
})
export class ApiKeysComponent implements OnInit {
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
          iconName: iconMarker('edit'),
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.openApiKeyForm(row),
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
    uniqueRowTag: (row) => 'api-key-' + row.name + '-' + row.created_at.$date,
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
      switchMap(() => this.ws.call('api_key.delete', [apiKey.id])),
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
