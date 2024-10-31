import { AsyncPipe } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { uniq } from 'lodash-es';
import {
  filter, map, of, shareReplay, switchMap, tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { ParamsBuilder } from 'app/helpers/params-builder/params-builder.class';
import { ApiKey } from 'app/interfaces/api-key.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { SearchInputComponent } from 'app/modules/forms/search-input/components/search-input/search-input.component';
import { SearchProperty } from 'app/modules/forms/search-input/types/search-property.interface';
import { SearchQuery, AdvancedSearchQuery } from 'app/modules/forms/search-input/types/search-query.interface';
import { searchProperties, textProperty, booleanProperty } from 'app/modules/forms/search-input/utils/search-properties.utils';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { ApiDataProvider } from 'app/modules/ix-table/classes/api-data-provider/api-data-provider';
import { PaginationServerSide } from 'app/modules/ix-table/classes/api-data-provider/pagination-server-side.class';
import { SortingServerSide } from 'app/modules/ix-table/classes/api-data-provider/sorting-server-side.class';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { dateColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-date/ix-cell-date.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableDetailsRowDirective } from 'app/modules/ix-table/directives/ix-table-details-row.directive';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { TablePagination } from 'app/modules/ix-table/interfaces/table-pagination.interface';
import { createTable } from 'app/modules/ix-table/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiKeyFormComponent } from 'app/pages/credentials/users/user-api-keys/components/api-key-form-dialog/api-key-form-dialog.component';
import { userApiKeysElements } from 'app/pages/credentials/users/user-api-keys/user-api-keys.elements';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { SlideInService } from 'app/services/slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-user-api-keys',
  templateUrl: './user-api-keys.component.html',
  styleUrls: ['./user-api-keys.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    SearchInputComponent,
    TestDirective,
    UiSearchDirective,
    RequiresRolesDirective,
    MatButton,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTableDetailsRowDirective,
    IxTablePagerComponent,
    TranslateModule,
    AsyncPipe,
    PageHeaderComponent,
  ],
})
export class UserApiKeysComponent implements OnInit {
  protected searchQuery: SearchQuery<ApiKey>;
  protected searchProperties: SearchProperty<ApiKey>[] = [];
  protected readonly requiredRoles = [Role.ApiKeyWrite, Role.SharingAdmin, Role.ReadonlyAdmin];
  protected readonly searchableElements = userApiKeysElements;
  protected readonly advancedSearchPlaceholder = this.translate.instant('Name ~ "admin"');

  dataProvider: ApiDataProvider<'api_key.query'>;

  columns = createTable<ApiKey>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
    }),
    textColumn({
      title: this.translate.instant('Username'),
      propertyName: 'username',
    }),
    textColumn({
      title: this.translate.instant('Keyhash'),
      propertyName: 'keyhash',
    }),
    dateColumn({
      title: this.translate.instant('Created date'),
      propertyName: 'created_at',
    }),
    textColumn({
      title: this.translate.instant('Expires date'),
      propertyName: 'expires_at',
      getValue: (row) => row.expires_at || this.translate.instant('Never'),
    }),
    actionsColumn({
      actions: [
        {
          iconName: iconMarker('mdi-pencil'),
          tooltip: this.translate.instant('Edit'),
          requiredRoles: this.requiredRoles,
          hidden: (row) => of(row.revoked),
          onClick: (row) => this.openForm(row),
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
    uniqueRowTag: (row) => `api-key-${row.name}-${row.created_at.$date}`,
    ariaLabels: (row) => [row.id.toString(), this.translate.instant('API Key')],
  });

  pagination: TablePagination = {
    pageSize: 50,
    pageNumber: 1,
  };

  private readonly apiKeys$ = this.ws.call('api_key.query').pipe(shareReplay({ bufferSize: 1, refCount: true }));

  protected readonly nameSuggestions$ = this.apiKeys$.pipe(
    map((keys) => uniq(keys.map((key) => ({ label: key.name, value: key.name })))),
  );

  protected readonly usernameSuggestions$ = this.apiKeys$.pipe(
    map((keys) => uniq(keys.map((key) => ({ label: key.username, value: key.username })))),
  );

  constructor(
    protected emptyService: EmptyService,
    private translate: TranslateService,
    private ws: WebSocketService,
    private dialog: DialogService,
    private loader: AppLoaderService,
    private errorHandler: ErrorHandlerService,
    private slideIn: SlideInService,
  ) { }

  ngOnInit(): void {
    this.dataProvider = new ApiDataProvider(this.ws, 'api_key.query');
    this.dataProvider.paginationStrategy = new PaginationServerSide();
    this.dataProvider.sortingStrategy = new SortingServerSide();
    this.setDefaultSort();
    this.dataProvider.load();

    this.setSearchProperties();
  }

  setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 3,
      direction: SortDirection.Desc,
      propertyName: 'created_at',
    });
  }

  openForm(apiKey?: ApiKey): void {
    this.slideIn.open(ApiKeyFormComponent, { data: apiKey })
      .slideInClosed$
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.dataProvider.load());
  }

  doDelete(apiKey: ApiKey): void {
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
      next: () => this.dataProvider.load(),
      error: (error) => {
        this.errorHandler.showErrorModal(error);
        this.loader.close();
      },
      complete: () => this.loader.close(),
    });
  }

  private setSearchProperties(): void {
    this.searchProperties = searchProperties<ApiKey>([
      textProperty('name', this.translate.instant('Name'), this.nameSuggestions$),
      textProperty('username', this.translate.instant('Username'), this.usernameSuggestions$),
      booleanProperty('revoked', this.translate.instant('Revoked')),
    ]);
  }

  onSearch(query: SearchQuery<ApiKey>): void {
    if (!query) {
      return;
    }

    this.searchQuery = query;

    if (query?.isBasicQuery) {
      const term = `(?i)${query.query || ''}`;
      const params = new ParamsBuilder<ApiKey>()
        .filter('name', '~', term)
        .orFilter('username', '~', term)
        .getParams();

      this.dataProvider.setParams(params);
    }

    if (query && !query.isBasicQuery) {
      this.dataProvider.setParams([(query as AdvancedSearchQuery<ApiKey>).filters]);
    }

    this.dataProvider.load();
  }
}
