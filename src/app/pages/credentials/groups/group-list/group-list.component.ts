import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, inject, signal, viewChild,
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
import { formatRoleNames, Role } from 'app/enums/role.enum';
import { Group } from 'app/interfaces/group.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { ArrayDataProvider } from 'app/modules/tn-table/classes/array-data-provider/array-data-provider';
import { mapTnSortToTableSort } from 'app/modules/tn-table/utils';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { reflectSortIntoTable, restrictToSingleExpandedRow } from 'app/modules/tn-table/utils';
import { ApiService } from 'app/modules/websocket/api.service';
import { GroupDetailsRowComponent } from 'app/pages/credentials/groups/group-details-row/group-details-row.component';
import { getGroupFormConfig } from 'app/pages/credentials/groups/group-form/group.form-config';
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
  private api = inject(ApiService);

  protected readonly requiredRoles = [Role.AccountWrite];
  protected readonly searchableElements = groupListElements;

  protected readonly dataProvider = new ArrayDataProvider<Group>();
  protected readonly currentPage = toSignal(this.dataProvider.currentPage$, { initialValue: [] as Group[] });
  protected readonly table = viewChild(TnTableComponent<Group>);

  protected readonly displayedColumns = ['group', 'gid', 'builtin', 'sudo', 'smb', 'roles'];
  protected readonly trackById = (_: number, row: Group): number => row.id;

  /**
   * The sort the list opens with. One declaration for both halves of it — `setDefaultSort` maps
   * it into the data provider and `activeSort` seeds the header arrow from it — so the arrow
   * can't end up pointing at a column the provider isn't sorting by.
   */
  private readonly defaultSort: TnSortEvent = { column: 'gid', direction: 'asc' };

  // Remembered so the arrow shows from the start and survives a table rebuild; see
  // `reflectSortIntoTable`.
  private readonly activeSort = signal<TnSortEvent | null>(this.defaultSort);

  constructor() {
    restrictToSingleExpandedRow(this.table);
    reflectSortIntoTable(this.table, this.activeSort);
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
    return formatRoleNames(row.roles, (key) => this.translate.instant(key)) || this.translate.instant('N/A');
  }

  protected onRowClick(row: Group): void {
    this.table()?.toggleRowExpansion(row);
  }

  protected onSortChange(event: TnSortEvent): void {
    this.activeSort.set(event);
    this.dataProvider.setSorting(mapTnSortToTableSort(event, this.displayedColumns));
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
    // Self-contained config — the form renders immediately and loads its async bits (privilege
    // options/selection, name check, next GID) on the fly into their own fields, no panel block.
    this.formPanel.openForm(getGroupFormConfig(this.api, this.translate, this.store$, group), {
      title: group ? this.translate.instant('Edit Group') : this.translate.instant('Add Group'),
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
    this.dataProvider.setSorting(mapTnSortToTableSort(this.defaultSort, this.displayedColumns));
  }
}
