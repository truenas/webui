import { AsyncPipe } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import {
  filter, map, shareReplay, switchMap, take,
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
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { ApiDataProvider } from 'app/modules/ix-table/classes/api-data-provider/api-data-provider';
import { PaginationServerSide } from 'app/modules/ix-table/classes/api-data-provider/pagination-server-side.class';
import { SortingServerSide } from 'app/modules/ix-table/classes/api-data-provider/sorting-server-side.class';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { yesNoColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-yes-no/ix-cell-yes-no.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { TablePagination } from 'app/modules/ix-table/interfaces/table-pagination.interface';
import { createTable } from 'app/modules/ix-table/utils';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { PrivilegeFormComponent } from 'app/pages/credentials/groups/privilege/privilege-form/privilege-form.component';
import { privilegesListElements } from 'app/pages/credentials/groups/privilege/privilege-list/privilege-list.elements';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { SlideInService } from 'app/services/slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-privilege-list',
  templateUrl: './privilege-list.component.html',
  styleUrls: ['./privilege-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatButton,
    TestDirective,
    RequiresRolesDirective,
    UiSearchDirective,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTablePagerComponent,
    TranslateModule,
    AsyncPipe,
    PageHeaderComponent,
    SearchInputComponent,
  ],
})
export class PrivilegeListComponent implements OnInit {
  protected readonly requiredRoles = [Role.FullAdmin];

  protected dataProvider: ApiDataProvider<'privilege.query'>;
  protected readonly advancedSearchPlaceholder = this.translate.instant('Name ^ "Local" AND "Web Shell Access" = true');
  protected searchProperties: SearchProperty<Privilege>[] = [];
  protected readonly searchableElements = privilegesListElements;

  columns = createTable<Privilege>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
    }),
    textColumn({
      title: this.translate.instant('Roles'),
      getValue: (row) => row.roles.map((role) => {
        return roleNames.has(role) ? this.translate.instant(roleNames.get(role)) : role;
      }).join(', ') || this.translate.instant('N/A'),
      disableSorting: true,
    }),
    textColumn({
      title: this.translate.instant('Local Groups'),
      getValue: (row) => row.local_groups.length,
      disableSorting: true,
    }),
    textColumn({
      title: this.translate.instant('DS Groups'),
      getValue: (row) => row.ds_groups.length,
      disableSorting: true,
    }),
    yesNoColumn({
      title: this.translate.instant('Web Shell Access'),
      propertyName: 'web_shell',
    }),
    actionsColumn({
      actions: [
        {
          iconName: iconMarker('edit'),
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.openForm(row),
        },
        {
          iconName: iconMarker('mdi-delete'),
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => this.doDelete(row),
          hidden: (row) => of(!!row.builtin_name),
          requiredRoles: this.requiredRoles,
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => 'privilege-' + row.name,
    ariaLabels: (row) => [row.name, this.translate.instant('Privilege')],
  });

  searchQuery: SearchQuery<Privilege>;
  privileges: Privilege[] = [];
  pagination: TablePagination = {
    pageSize: 50,
    pageNumber: 1,
  };

  private groupsSuggestions$ = this.ws.call('group.query', [[['local', '=', true]]]).pipe(
    map((groups) => groups.map((group) => ({
      label: group.group,
      value: `"${group.group}"`,
    }))),
    take(1),
    shareReplay({ refCount: true, bufferSize: 1 }),
  );

  private readonly rolesSuggestions$ = of(Object.values(Role)).pipe(
    map((roles) => roles.map((key) => ({
      label: this.translate.instant(roleNames.get(key)),
      value: `"${this.translate.instant(roleNames.get(key))}"`,
    }))),
  );

  constructor(
    private slideInService: SlideInService,
    private ws: WebSocketService,
    private translate: TranslateService,
    private dialogService: DialogService,
    protected emptyService: EmptyService,
    private errorHandler: ErrorHandlerService,
  ) { }

  ngOnInit(): void {
    this.dataProvider = new ApiDataProvider(this.ws, 'privilege.query');
    this.dataProvider.paginationStrategy = new PaginationServerSide();
    this.dataProvider.sortingStrategy = new SortingServerSide();

    this.getPrivileges();
    this.setSearchProperties();
  }

  openForm(privilege?: Privilege): void {
    const slideInRef = this.slideInService.open(PrivilegeFormComponent, { data: privilege });
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.getPrivileges();
    });
  }

  doDelete(privilege: Privilege): void {
    this.dialogService
      .confirm({
        title: this.translate.instant('Delete Privilege'),
        message: this.translate.instant('Are you sure you want to delete the <b>{name}</b>?', {
          name: privilege.name,
        }),
        buttonText: this.translate.instant('Delete'),
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.ws.call('privilege.delete', [privilege.id])),
        untilDestroyed(this),
      )
      .subscribe({
        next: () => {
          this.getPrivileges();
        },
        error: (error) => {
          this.dialogService.error(this.errorHandler.parseError(error));
        },
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
