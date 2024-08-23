import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { select, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Observable, combineLatest, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role, roleNames } from 'app/enums/role.enum';
import { Group } from 'app/interfaces/group.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { yesNoColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-yes-no/ix-cell-yes-no.component';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import { GroupFormComponent } from 'app/pages/account/groups/group-form/group-form.component';
import { groupListElements } from 'app/pages/account/groups/group-list/group-list.elements';
import { groupPageEntered, groupRemoved } from 'app/pages/account/groups/store/group.actions';
import { selectGroupState, selectGroupsTotal, selectGroups } from 'app/pages/account/groups/store/group.selectors';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { AppsState } from 'app/store';
import { builtinGroupsToggled } from 'app/store/preferences/preferences.actions';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-group-list',
  templateUrl: './group-list.component.html',
  styleUrls: ['./group-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupListComponent implements OnInit {
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
        .map((role) => (roleNames.has(role) ? this.translate.instant(roleNames.get(role)) : role))
        .join(', ') || this.translate.instant('N/A'),
    }),
  ], {
    rowTestId: (row) => 'group-' + row.group,
    ariaLabels: (row) => [row.group, this.translate.instant('Group')],
  });

  hideBuiltinGroups = true;
  filterString = '';
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

  get emptyConfigService(): EmptyService {
    return this.emptyService;
  }

  constructor(
    private emptyService: EmptyService,
    private slideInService: IxSlideInService,
    private cdr: ChangeDetectorRef,
    private store$: Store<AppsState>,
    private translate: TranslateService,
  ) { }

  ngOnInit(): void {
    this.store$.dispatch(groupPageEntered());
    this.getPreferences();
    this.getGroups();
    this.setDefaultSort();
  }

  toggleBuiltins(): void {
    this.store$.dispatch(builtinGroupsToggled());
  }

  doAdd(): void {
    this.slideInService.open(GroupFormComponent);
  }

  onListFiltered(query: string): void {
    this.filterString = query.toLowerCase();
    this.dataProvider.setFilter({ list: this.groups, query, columnKeys: ['group', 'gid'] });
  }

  handleDeletedGroup(id: number): void {
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
        this.filterString = '';
        this.onListFiltered(this.filterString);
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
