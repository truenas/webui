import { AsyncPipe } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCellDefDirective, TnHeaderCellDefDirective, TnIconButtonComponent,
  TnTableColumnDirective, TnTableComponent, TnTablePagerComponent, type TnSortEvent,
} from '@truenas/ui-components';
import { uniq } from 'lodash-es';
import {
  filter, map, shareReplay,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { formatDistanceToNowShortened } from 'app/helpers/format-distance-to-now-shortened';
import { ParamsBuilder } from 'app/helpers/params-builder/params-builder.class';
import { ApiKey } from 'app/interfaces/api-key.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { IxDateComponent } from 'app/modules/dates/pipes/ix-date/ix-date.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { SearchInputComponent } from 'app/modules/forms/search-input/components/search-input/search-input.component';
import { SearchProperty } from 'app/modules/forms/search-input/types/search-property.interface';
import { SearchQuery, AdvancedSearchQuery } from 'app/modules/forms/search-input/types/search-query.interface';
import { searchProperties, textProperty, booleanProperty } from 'app/modules/forms/search-input/utils/search-properties.utils';
import { ApiDataProvider } from 'app/modules/ix-table/classes/api-data-provider/api-data-provider';
import { PaginationServerSide } from 'app/modules/ix-table/classes/api-data-provider/pagination-server-side.class';
import { SortingServerSide } from 'app/modules/ix-table/classes/api-data-provider/sorting-server-side.class';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { mapTnSortToTableSort } from 'app/modules/ix-table/utils';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ApiService } from 'app/modules/websocket/api.service';
import { ApiKeyFormComponent } from 'app/pages/credentials/users/user-api-keys/components/api-key-form/api-key-form.component';
import { userApiKeysElements } from 'app/pages/credentials/users/user-api-keys/user-api-keys.elements';

@Component({
  selector: 'ix-user-api-keys',
  templateUrl: './user-api-keys.component.html',
  styleUrls: ['./user-api-keys.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SearchInputComponent,
    UiSearchDirective,
    RequiresRolesDirective,
    TnButtonComponent,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnIconButtonComponent,
    TnTablePagerComponent,
    IxDateComponent,
    YesNoPipe,
    TranslateModule,
    AsyncPipe,
    PageHeaderComponent,
  ],
})
export class UserApiKeysComponent implements OnInit {
  protected emptyService = inject(EmptyService);
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private dialog = inject(DialogService);

  private authService = inject(AuthService);
  private slideIn = inject(SlideIn);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  protected searchQuery: SearchQuery<ApiKey>;
  protected searchProperties: SearchProperty<ApiKey>[] = [];
  protected readonly requiredRoles = [Role.ApiKeyWrite, Role.SharingAdmin, Role.ReadonlyAdmin];
  protected readonly searchableElements = userApiKeysElements;
  protected readonly advancedSearchPlaceholder = this.translate.instant('Name ~ "admin"');

  dataProvider: ApiDataProvider<'api_key.query'>;

  protected readonly displayedColumns = ['name', 'username', 'local', 'revoked', 'created_at', 'expires_at', 'actions'];
  protected readonly emptyIcon = 'mdi-key-outline';
  protected readonly trackById = (_index: number, row: ApiKey): number => row.id;

  private readonly canWriteApiKeys = toSignal(this.authService.hasRole([Role.ApiKeyWrite]), { initialValue: false });
  private readonly currentUsername = toSignal(
    this.authService.user$.pipe(filter((user) => !!user), map((user) => user.pw_name)),
  );

  protected isActionDisabled(row: ApiKey): boolean {
    return !this.canWriteApiKeys() && row.username !== this.currentUsername();
  }

  protected expiresLabel(row: ApiKey): string {
    return row.expires_at?.$date
      ? formatDistanceToNowShortened(row.expires_at.$date)
      : this.translate.instant('Never');
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToTableSort<ApiKey>(event, this.displayedColumns));
  }

  private readonly apiKeys$ = this.api.call('api_key.query').pipe(shareReplay({ bufferSize: 1, refCount: true }));

  protected readonly nameSuggestions$ = this.apiKeys$.pipe(
    map((keys) => uniq(keys.map((key) => ({ label: key.name, value: key.name })))),
  );

  protected readonly usernameSuggestions$ = this.apiKeys$.pipe(
    map((keys) => uniq(keys.map((key) => ({ label: key.username, value: key.username })))),
  );

  ngOnInit(): void {
    this.dataProvider = new ApiDataProvider(this.api, 'api_key.query');
    this.dataProvider.paginationStrategy = new PaginationServerSide();
    this.dataProvider.sortingStrategy = new SortingServerSide();
    this.setDefaultSort();
    this.dataProvider.load();

    this.handleUsernameQueryParams();
    this.setSearchProperties();
  }

  setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: this.displayedColumns.indexOf('created_at'),
      direction: SortDirection.Desc,
      propertyName: 'created_at',
    });
  }

  openForm(apiKey?: ApiKey): void {
    this.slideIn.open(ApiKeyFormComponent, { data: { editingKey: apiKey } })
      .onSuccess(() => this.dataProvider.load(), this.destroyRef);
  }

  doDelete(apiKey: ApiKey): void {
    this.dialog.confirmDelete({
      title: this.translate.instant('Delete API Key'),
      message: this.translate.instant('Are you sure you want to delete the <b>{name}</b> API Key?', { name: apiKey.name }),
      call: () => this.api.call('api_key.delete', [apiKey.id]),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.dataProvider.load());
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

  private handleUsernameQueryParams(): void {
    this.route.queryParams.pipe(
      filter((params) => params.userName),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((params) => {
      this.onSearch({
        isBasicQuery: true,
        query: params.userName as string,
      });
    });
  }
}
