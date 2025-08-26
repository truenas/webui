import { AsyncPipe } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAnchor, MatButton } from '@angular/material/button';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { select, Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  Observable, combineLatest, of,
} from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role, roleNames } from 'app/enums/role.enum';
import { Group } from 'app/interfaces/group.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { yesNoColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-yes-no/ix-cell-yes-no.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableDetailsRowDirective } from 'app/modules/ix-table/directives/ix-table-details-row.directive';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { GroupDetailsRowComponent } from 'app/pages/credentials/groups/group-details-row/group-details-row.component';
import { GroupFormComponent } from 'app/pages/credentials/groups/group-form/group-form.component';
import { groupListElements } from 'app/pages/credentials/groups/group-list/group-list.elements';
import { groupPageEntered, groupRemoved } from 'app/pages/credentials/groups/store/group.actions';
import { selectGroupState, selectGroupsTotal, selectGroups } from 'app/pages/credentials/groups/store/group.selectors';
import { AppState } from 'app/store';
import { builtinGroupsToggled } from 'app/store/preferences/preferences.actions';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-group-list',
  templateUrl: './group-list.component.html',
  styleUrls: ['./group-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BasicSearchComponent,
    FormsModule,
    MatSlideToggle,
    TestDirective,
    UiSearchDirective,
    MatAnchor,
    RouterLink,
    RequiresRolesDirective,
    MatButton,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTableDetailsRowDirective,
    GroupDetailsRowComponent,
    IxTablePagerComponent,
    TranslateModule,
    AsyncPipe,
    PageHeaderComponent,
  ],
})
export class GroupListComponent implements OnInit {
  private emptyService = inject(EmptyService);
  private slideIn = inject(SlideIn);
  private cdr = inject(ChangeDetectorRef);
  private store$ = inject<Store<AppState>>(Store);
  private translate = inject(TranslateService);

  protected readonly requiredRoles = [Role.AccountWrite];
  protected readonly searchableElements = groupListElements;

  dataProvider = new ArrayDataProvider<Group>();
  columns = createTable<Group>([
    textColumn({
      title: this.translate.instant('Group'),
      propertyName: 'group',
    }),
    textColumn({
      title: this.translate.instant('GID'),
      propertyName: 'gid',
    }),
    yesNoColumn({
      title: this.translate.instant('Builtin'),
      propertyName: 'builtin',
    }),
    yesNoColumn({
      title: this.translate.instant('Allows sudo commands'),
      getValue: (row) => !!row.sudo_commands?.length,
    }),
    yesNoColumn({
      title: this.translate.instant('Samba Authentication'),
      propertyName: 'smb',
    }),
    textColumn({
      title: this.translate.instant('Roles'),
      getValue: (row) => row.roles
        .map((role) => this.translate.instant(roleNames.get(role) || role))
        .join(', ') || this.translate.instant('N/A'),
    }),
  ], {
    uniqueRowTag: (row) => 'group-' + row.group,
    ariaLabels: (row) => [row.group, this.translate.instant('Group')],
  });

  hideBuiltinGroups = true;
  filterString = signal('');
  groups: Group[] = [];

  isLoading$ = this.store$.select(selectGroupState).pipe(map((state) => state.isLoading));
  emptyType$: Observable<EmptyType> = combineLatest([
    this.isLoading$,
    this.store$.select(selectGroupsTotal).pipe(map((total) => total === 0)),
    this.store$.select(selectGroupState).pipe(map((state) => state.error)),
  ]).pipe(
    switchMap(([isLoading, isNoData, isError]) => {
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

  protected get emptyConfigService(): EmptyService {
    return this.emptyService;
  }

  ngOnInit(): void {
    this.store$.dispatch(groupPageEntered());
    this.getPreferences();
    this.getGroups();
    this.setDefaultSort();
  }

  protected toggleBuiltins(): void {
    this.store$.dispatch(builtinGroupsToggled());
  }

  protected doAdd(): void {
    this.slideIn.open(GroupFormComponent);
  }

  protected onListFiltered(query: string): void {
    this.filterString.set(query);
    this.dataProvider.setFilter({ list: this.groups, query, columnKeys: ['group', 'gid'] });
  }

  protected handleDeletedGroup(id: number): void {
    this.store$.dispatch(groupRemoved({ id }));
  }

  private getPreferences(): void {
    this.store$.pipe(
      waitForPreferences,
      untilDestroyed(this),
    ).subscribe((preferences) => {
      this.hideBuiltinGroups = preferences.hideBuiltinGroups;
      this.cdr.markForCheck();
    });
  }

  private getGroups(): void {
    this.store$.pipe(
      select(selectGroups),
      untilDestroyed(this),
    ).subscribe({
      next: (groups) => {
        this.groups = groups;
        this.filterString.set('');
        this.onListFiltered(this.filterString());
        this.cdr.markForCheck();
      },
      error: () => {
        this.groups = [];
        this.dataProvider.setRows(this.groups);
        this.cdr.markForCheck();
      },
    });
  }

  private setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 1,
      direction: SortDirection.Asc,
      propertyName: 'gid',
    });
  }
}
