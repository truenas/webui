import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, inject, signal, viewChild, effect,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { select, Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnSlideToggleComponent, TnTableComponent, TnTableColumnDirective,
  TnHeaderCellDefDirective, TnCellDefDirective, TnDetailRowDefDirective, TnTablePagerComponent, TnSortEvent,
} from '@truenas/ui-components';
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
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { GroupDetailsRowComponent } from 'app/pages/credentials/groups/group-details-row/group-details-row.component';
import { GroupFormComponent } from 'app/pages/credentials/groups/group-form/group-form.component';
import { groupListElements } from 'app/pages/credentials/groups/group-list/group-list.elements';
import { groupPageEntered, groupRemoved } from 'app/pages/credentials/groups/store/group.actions';
import { selectGroupState, selectGroupsTotal, selectGroups } from 'app/pages/credentials/groups/store/group.selectors';
import { AppState } from 'app/store';
import { builtinGroupsToggled } from 'app/store/preferences/preferences.actions';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';

@Component({
  selector: 'ix-group-list',
  templateUrl: './group-list.component.html',
  styleUrls: ['./group-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BasicSearchComponent,
    TnSlideToggleComponent,
    UiSearchDirective,
    RequiresRolesDirective,
    TnButtonComponent,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnDetailRowDefDirective,
    GroupDetailsRowComponent,
    TnTablePagerComponent,
    TranslateModule,
    PageHeaderComponent,
  ],
})
export class GroupListComponent implements OnInit {
  private emptyService = inject(EmptyService);
  private cdr = inject(ChangeDetectorRef);
  private store$ = inject<Store<AppState>>(Store);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);
  private formPanel = inject(FormSidePanelService);

  protected readonly requiredRoles = [Role.AccountWrite];
  protected readonly searchableElements = groupListElements;

  protected readonly dataProvider = new ArrayDataProvider<Group>();
  protected readonly currentPage = toSignal(this.dataProvider.currentPage$, { initialValue: [] as Group[] });
  protected readonly table = viewChild(TnTableComponent<Group>);

  protected readonly displayedColumns = ['group', 'gid', 'builtin', 'sudo', 'smb', 'roles'];
  protected readonly trackById = (_: number, row: Group): number => row.id;

  // tn-table allows multiple rows expanded at once and exposes no single-expand input or
  // row-expand output to hook into, so we restore the single-expand behavior of the previous
  // ix-table here: whenever a second row opens (via row click or the expand chevron) we collapse
  // back to just the newly-opened one. We diff against the previous set rather than caching a
  // single row reference, so a data reload (which swaps in fresh row objects) can't leave a stale
  // reference behind — the set tracking stays consistent with whatever tn-table currently holds.
  private previousExpandedRows = new Set<unknown>();
  private defaultSortReflected = false;

  constructor() {
    effect(() => {
      const table = this.table();
      if (!table) {
        return;
      }
      const expanded = table.expandedRows();
      if (expanded.size <= 1) {
        this.previousExpandedRows = new Set(expanded);
        return;
      }
      const newest = [...expanded].find((row) => !this.previousExpandedRows.has(row));
      const collapsed = newest ? new Set<unknown>([newest]) : new Set<unknown>();
      this.previousExpandedRows = collapsed;
      table.expandedRows.set(collapsed);
    });

    // The data provider sorts the rows, but tn-table tracks its own sort-arrow state, so reflect
    // the default sort in the header indicator once the table view is available.
    effect(() => {
      const table = this.table();
      if (!table || this.defaultSortReflected) {
        return;
      }
      this.defaultSortReflected = true;
      table.sortColumn.set('gid');
      table.sortDirection.set('asc');
    });
  }

  protected hideBuiltinGroups = true;
  protected readonly searchQuery = signal('');
  private groups: Group[] = [];

  private readonly isLoading$ = this.store$.select(selectGroupState).pipe(map((state) => state.isLoading));
  protected readonly isLoading = toSignal(this.isLoading$, { initialValue: false });

  private readonly emptyType$: Observable<EmptyType> = combineLatest([
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

  private readonly emptyMessage$: Observable<string> = this.emptyType$.pipe(
    map((type) => this.translate.instant(this.emptyService.defaultEmptyConfig(type).title)),
  );

  protected readonly emptyMessage = toSignal(this.emptyMessage$, { initialValue: '' });

  protected getRolesValue(row: Group): string {
    return row.roles
      .map((role) => this.translate.instant(roleNames.get(role) || role))
      .join(', ') || this.translate.instant('N/A');
  }

  protected onRowClick(row: Group): void {
    this.table()?.toggleRowExpansion(row);
  }

  protected onSortChange(event: TnSortEvent): void {
    const direction = event.direction === '' ? null : (event.direction as SortDirection);
    this.dataProvider.setSorting({
      propertyName: direction ? (event.column as keyof Group) : null,
      direction,
      active: null,
    });
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
    this.openGroupForm(undefined);
  }

  protected doEdit(group: Group): void {
    this.openGroupForm(group);
  }

  private openGroupForm(group: Group | undefined): void {
    this.formPanel.open(GroupFormComponent, {
      title: group ? this.translate.instant('Edit Group') : this.translate.instant('Add Group'),
      inputs: { group },
    });
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataProvider.setFilter({ list: this.groups, query, columnKeys: ['group', 'gid'] });
  }

  protected handleDeletedGroup(id: number): void {
    this.store$.dispatch(groupRemoved({ id }));
  }

  private getPreferences(): void {
    this.store$.pipe(
      waitForPreferences,
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((preferences) => {
      this.hideBuiltinGroups = preferences.hideBuiltinGroups;
      this.cdr.markForCheck();
    });
  }

  private getGroups(): void {
    this.store$.pipe(
      select(selectGroups),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (groups) => {
        this.groups = groups;
        this.onListFiltered(this.searchQuery());
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
