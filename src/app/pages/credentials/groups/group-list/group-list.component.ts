import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, computed, DestroyRef, inject, signal,
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
import { AuthService } from 'app/modules/auth/auth.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { mapTnSortToTableSort } from 'app/modules/ix-table/utils';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
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
  private authService = inject(AuthService);

  protected readonly requiredRoles = [Role.AccountWrite];
  protected readonly searchableElements = groupListElements;

  protected readonly dataProvider = new ArrayDataProvider<Group>();
  protected readonly currentPage = toSignal(this.dataProvider.currentPage$, { initialValue: [] as Group[] });

  protected readonly displayedColumns = ['group', 'gid', 'builtin', 'sudo', 'smb', 'roles'];
  protected readonly trackById = (_: number, row: Group): number => row.id;

  private readonly hasAccountWrite = toSignal(this.authService.hasRole(this.requiredRoles), {
    initialValue: false,
  });

  /**
   * Only expand rows whose detail panel would actually render an action: `ix-group-details-row`
   * shows Members for local groups, Edit for editable local ones, and Delete for non-builtin
   * groups with AccountWrite. Without this, builtin/non-local rows expand into a blank panel.
   *
   * A `computed` of the predicate, not a plain arrow that reads the role signal internally:
   * `hasAccountWrite` starts `false` and flips once the role resolves, and only a new function
   * identity is guaranteed to make the table re-evaluate expandability. A stable identity would
   * leave that up to whether `tn-table` calls the predicate from a reactive binding.
   */
  protected readonly canExpandGroup = computed(() => {
    const hasAccountWrite = this.hasAccountWrite();
    return (group: Group): boolean => group.local || (!group.builtin && hasAccountWrite);
  });

  /**
   * The sort the list opens with. One declaration for both halves of it — `setDefaultSort` maps
   * it into the data provider and the two-way `[(sortColumn)]`/`[(sortDirection)]` bindings seed
   * the header arrow from it — so the arrow can't end up pointing at a column the provider isn't
   * sorting by. The table writes the bindings back on every header click, and re-reads them when
   * it is destroyed and rebuilt (the empty state replaces it whenever the list empties out), so
   * the arrow survives searching down to zero results and back.
   */
  private readonly defaultSort: TnSortEvent = { column: 'gid', direction: 'asc' };

  protected readonly sortColumn = signal(this.defaultSort.column);
  protected readonly sortDirection = signal(this.defaultSort.direction);

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

  private readonly emptyType = toSignal(this.emptyType$, { initialValue: EmptyType.Loading });

  protected readonly emptyMessage = computed(() => this.emptyService.titleForType(this.emptyType()));

  protected readonly emptyDescription = computed(() => this.emptyService.descriptionForType(this.emptyType()));

  protected readonly emptyIcon = computed(() => this.emptyService.iconForType(this.emptyType()));

  protected getRolesValue(row: Group): string {
    return formatRoleNames(row.roles, (key) => this.translate.instant(key)) || this.translate.instant('N/A');
  }

  protected onSortChange(event: TnSortEvent): void {
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
