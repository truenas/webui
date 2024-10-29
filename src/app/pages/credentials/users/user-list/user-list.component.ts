import { AsyncPipe } from '@angular/common';
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { select, Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { combineLatest, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role, roleNames } from 'app/enums/role.enum';
import { User } from 'app/interfaces/user.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
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
import { TestDirective } from 'app/modules/test-id/test.directive';
import { userPageEntered, userRemoved } from 'app/pages/credentials/users/store/user.actions';
import { selectUsers, selectUserState, selectUsersTotal } from 'app/pages/credentials/users/store/user.selectors';
import { UserDetailsRowComponent } from 'app/pages/credentials/users/user-details-row/user-details-row.component';
import { UserFormComponent } from 'app/pages/credentials/users/user-form/user-form.component';
import { userListElements } from 'app/pages/credentials/users/user-list/user-list.elements';
import { SlideInService } from 'app/services/slide-in.service';
import { AppState } from 'app/store';
import { builtinUsersToggled } from 'app/store/preferences/preferences.actions';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    SearchInput1Component,
    MatSlideToggle,
    TestDirective,
    UiSearchDirective,
    RequiresRolesDirective,
    MatButton,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTableDetailsRowDirective,
    UserDetailsRowComponent,
    IxTablePagerComponent,
    TranslateModule,
    AsyncPipe,
    PageHeaderComponent,
  ],
})
export class UserListComponent implements OnInit {
  protected readonly requiredRoles = [Role.AccountWrite];
  protected readonly searchableElements = userListElements;

  dataProvider = new ArrayDataProvider<User>();
  columns = createTable<User>([
    textColumn({
      title: this.translate.instant('Username'),
      propertyName: 'username',
    }),
    textColumn({
      title: this.translate.instant('UID'),
      propertyName: 'uid',
    }),
    yesNoColumn({
      title: this.translate.instant('Builtin'),
      propertyName: 'builtin',
    }),
    textColumn({
      title: this.translate.instant('Full Name'),
      propertyName: 'full_name',
    }),
    textColumn({
      title: this.translate.instant('Roles'),
      getValue: (row) => row.roles
        .map((role) => (roleNames.has(role) ? this.translate.instant(roleNames.get(role)) : role))
        .join(', ') || this.translate.instant('N/A'),
    }),
  ], {
    uniqueRowTag: (row) => 'user-' + row.username,
    ariaLabels: (row) => [row.username, this.translate.instant('User')],
  });

  isLoading$ = this.store$.select(selectUserState).pipe(map((state) => state.isLoading));
  emptyType$: Observable<EmptyType> = combineLatest([
    this.isLoading$,
    this.store$.select(selectUsersTotal).pipe(map((total) => total === 0)),
    this.store$.select(selectUserState).pipe(map((state) => state.error)),
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

  hideBuiltinUsers = true;
  filterString = '';
  users: User[] = [];

  get emptyConfigService(): EmptyService {
    return this.emptyService;
  }

  constructor(
    private slideInService: SlideInService,
    private cdr: ChangeDetectorRef,
    private store$: Store<AppState>,
    private translate: TranslateService,
    private emptyService: EmptyService,
  ) { }

  ngOnInit(): void {
    this.store$.dispatch(userPageEntered());
    this.getPreferences();
    this.getUsers();
    this.setDefaultSort();
  }

  getPreferences(): void {
    this.store$.pipe(
      waitForPreferences,
      untilDestroyed(this),
    ).subscribe((preferences) => {
      this.hideBuiltinUsers = preferences.hideBuiltinUsers;
      this.cdr.markForCheck();
    });
  }

  getUsers(): void {
    this.store$.pipe(
      select(selectUsers),
      untilDestroyed(this),
    ).subscribe({
      next: (users) => {
        this.users = users;
        this.onListFiltered(this.filterString);
      },
      error: () => {
        this.users = [];
        this.dataProvider.setRows(this.users);
      },
    });
  }

  toggleBuiltins(): void {
    this.store$.dispatch(builtinUsersToggled());
  }

  doAdd(): void {
    this.slideInService.open(UserFormComponent, { wide: true });
  }

  onListFiltered(query: string): void {
    this.filterString = query.toLowerCase();
    this.dataProvider.setFilter({ list: this.users, query, columnKeys: ['username', 'full_name', 'uid'] });
  }

  setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 1,
      direction: SortDirection.Asc,
      propertyName: 'uid',
    });
  }

  handleDeletedUser(id: number): void {
    this.store$.dispatch(userRemoved({ id }));
  }
}
