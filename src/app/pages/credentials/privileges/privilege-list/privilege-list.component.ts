import { AsyncPipe } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  tnIconMarker,
  TnButtonComponent,
  TnCellDefDirective,
  TnHeaderCellDefDirective,
  TnTableColumnDirective,
  TnTableComponent,
  TnTablePagerComponent,
  TnTestIdDirective,
  type TnSortEvent,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import {
  map, shareReplay, take,
} from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role, roleNames } from 'app/enums/role.enum';
import { ParamsBuilder } from 'app/helpers/params-builder/params-builder.class';
import { Option } from 'app/interfaces/option.interface';
import { Privilege } from 'app/interfaces/privilege.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { SearchInputComponent } from 'app/modules/forms/search-input/components/search-input/search-input.component';
import { SearchProperty } from 'app/modules/forms/search-input/types/search-property.interface';
import { AdvancedSearchQuery, SearchQuery } from 'app/modules/forms/search-input/types/search-query.interface';
import { booleanProperty, searchProperties, textProperty } from 'app/modules/forms/search-input/utils/search-properties.utils';
import { ApiDataProvider } from 'app/modules/ix-table/classes/api-data-provider/api-data-provider';
import { PaginationServerSide } from 'app/modules/ix-table/classes/api-data-provider/pagination-server-side.class';
import { SortingServerSide } from 'app/modules/ix-table/classes/api-data-provider/sorting-server-side.class';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { mapTnSortToTableSort } from 'app/modules/ix-table/utils';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { TableActionsCellComponent } from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { PrivilegeFormComponent } from 'app/pages/credentials/privileges/privilege-form/privilege-form.component';
import { privilegesListElements } from 'app/pages/credentials/privileges/privilege-list/privilege-list.elements';

@Component({
  selector: 'ix-privilege-list',
  templateUrl: './privilege-list.component.html',
  styleUrls: ['./privilege-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnButtonComponent,
    RequiresRolesDirective,
    UiSearchDirective,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnTablePagerComponent,
    TableActionsCellComponent,
    TnTestIdDirective,
    TranslateModule,
    AsyncPipe,
    YesNoPipe,
    PageHeaderComponent,
    SearchInputComponent,
  ],
})
export class PrivilegeListComponent implements OnInit {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private dialogService = inject(DialogService);
  protected emptyService = inject(EmptyService);
  private formPanel = inject(FormSidePanelService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.PrivilegeWrite];

  protected dataProvider: ApiDataProvider<'privilege.query'>;
  protected readonly advancedSearchPlaceholder = this.translate.instant('Name ^ "Local" AND "Web Shell Access" = true');
  protected searchProperties: SearchProperty<Privilege>[] = [];
  protected readonly searchableElements = privilegesListElements;

  protected readonly displayedColumns = ['name', 'roles', 'local_groups', 'ds_groups', 'web_shell', 'actions'];

  protected readonly trackByPrivilegeId = (_index: number, row: Privilege): number => row.id;

  protected readonly actions: IconActionConfig<Privilege>[] = [
    {
      iconName: tnIconMarker('pencil', 'mdi'),
      tooltip: this.translate.instant('Edit'),
      onClick: (row) => this.openForm(row),
    },
    {
      iconName: tnIconMarker('delete', 'mdi'),
      tooltip: this.translate.instant('Delete'),
      onClick: (row) => this.doDelete(row),
      hidden: (row) => of(!!row.builtin_name),
      requiredRoles: this.requiredRoles,
    },
  ];

  protected uniqueRowTag(row: Privilege): string {
    return 'privilege-' + row.name;
  }

  protected ariaLabel(row: Privilege): string {
    return [row.name, this.translate.instant('Privilege')].join(' ');
  }

  protected getRolesValue(row: Privilege): string {
    return row.roles
      .map((role) => this.translate.instant(roleNames.get(role) || role))
      .join(', ') || this.translate.instant('N/A');
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToTableSort<Privilege>(event, this.displayedColumns));
  }

  searchQuery: SearchQuery<Privilege>;
  privileges: Privilege[] = [];

  private groupsSuggestions$ = this.api.call('group.query', [[['local', '=', true]]]).pipe(
    map((groups) => groups.map((group) => ({
      label: group.group,
      value: `"${group.group}"`,
    }))),
    take(1),
    shareReplay({ refCount: true, bufferSize: 1 }),
  );

  private readonly rolesSuggestions$ = of(Object.values(Role)).pipe(
    map((roles) => roles.map((key) => ({
      label: this.translate.instant(roleNames.get(key) || key),
      value: `"${this.translate.instant(roleNames.get(key) || key)}"`,
    }))),
  );

  ngOnInit(): void {
    this.dataProvider = new ApiDataProvider(this.api, 'privilege.query');
    this.dataProvider.paginationStrategy = new PaginationServerSide();
    this.dataProvider.sortingStrategy = new SortingServerSide();

    this.getPrivileges();
    this.setSearchProperties();
  }

  openForm(privilege?: Privilege): void {
    this.formPanel.open(PrivilegeFormComponent, {
      title: privilege
        ? this.translate.instant('Edit Privilege')
        : this.translate.instant('New Privilege'),
      inputs: { editPrivilege: privilege },
    }).onSuccess(() => this.getPrivileges(), this.destroyRef);
  }

  doDelete(privilege: Privilege): void {
    this.dialogService
      .confirmDelete({
        title: this.translate.instant('Delete Privilege'),
        message: this.translate.instant('Are you sure you want to delete the <b>{name}</b>?', {
          name: privilege.name,
        }),
        call: () => this.api.call('privilege.delete', [privilege.id]),
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.getPrivileges();
      });
  }

  onSearch(query: SearchQuery<Privilege>): void {
    if (!query) {
      return;
    }

    this.searchQuery = query;

    if (query?.isBasicQuery) {
      const term = `(?i)${query.query || ''}`;
      const params = new ParamsBuilder<Privilege>()
        .filter('name', '~', term)
        .getParams();

      this.dataProvider.setParams(params);
    }

    if (query && !query.isBasicQuery) {
      this.dataProvider.setParams(
        [(query as AdvancedSearchQuery<Privilege>).filters],
      );
    }

    this.dataProvider.load();
  }

  private setSearchProperties(): void {
    this.searchProperties = searchProperties<Privilege>([
      textProperty('name', this.translate.instant('Name'), of<Option[]>([])),
      booleanProperty('web_shell', this.translate.instant('Web Shell Access')),
      textProperty('local_groups.*.name', this.translate.instant('Local Groups Name'), this.groupsSuggestions$),
      textProperty('ds_groups.*.name', this.translate.instant('DS Groups Name'), this.groupsSuggestions$),
      textProperty('roles', this.translate.instant('Roles'), this.rolesSuggestions$, roleNames),
    ]);
  }

  private getPrivileges(): void {
    this.dataProvider.load();
  }
}
