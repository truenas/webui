import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { select, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { combineLatest, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { EmptyType } from 'app/enums/empty-type.enum';
import { User } from 'app/interfaces/user.interface';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { yesNoColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-yesno/ix-cell-yesno.component';
import { SortDirection } from 'app/modules/ix-table2/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { userPageEntered, userRemoved } from 'app/pages/account/users/store/user.actions';
import { selectUsers, selectUserState, selectUsersTotal } from 'app/pages/account/users/store/user.selectors';
import { UserFormComponent } from 'app/pages/account/users/user-form/user-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { AppState } from 'app/store';
import { builtinUsersToggled } from 'app/store/preferences/preferences.actions';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';

@UntilDestroy()
@Component({
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListComponent implements OnInit {
  dataProvider = new ArrayDataProvider<User>();
  columns = createTable<User>([
    textColumn({
      identifier: true,
      title: this.translate.instant('Username'),
      propertyName: 'username',
      sortable: true,
    }),
    textColumn({
      title: this.translate.instant('UID'),
      propertyName: 'uid',
      sortable: true,
    }),
    yesNoColumn({
      title: this.translate.instant('Builtin'),
      propertyName: 'builtin',
      sortable: true,
    }),
    textColumn({
      title: this.translate.instant('Full Name'),
      propertyName: 'full_name',
      sortable: true,
    }),
  ]);

  isLoading$ = this.store$.select(selectUserState).pipe(map((state) => state.isLoading));
  emptyType$: Observable<EmptyType> = combineLatest([
    this.isLoading$,
    this.store$.select(selectUsersTotal).pipe(map((total) => total === 0)),
    this.store$.select(selectUserState).pipe(map((state) => state.error)),
  ]).pipe(
    switchMap(([isLoading, isNoData, isError]) => {
      if (isLoading) {
        return of(EmptyType.Loading);
      }
      if (isError) {
        return of(EmptyType.Errors);
      }
      if (isNoData) {
        return of(EmptyType.NoPageData);
      }
      return of(EmptyType.NoSearchResults);
    }),
  );

  hideBuiltinUsers = true;
  filterString = '';
  users: User[] = [];

  get emptyConfigService(): EmptyService {
    return this.emptyService;
  }

  constructor(
    private slideInService: IxSlideInService,
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
        this.createDataSource(users);
      },
      error: () => {
        this.users = [];
        this.createDataSource();
      },
    });
  }

  createDataSource(users: User[] = []): void {
    this.dataProvider.setRows(users);
    this.cdr.markForCheck();
  }

  toggleBuiltins(): void {
    this.store$.dispatch(builtinUsersToggled());
  }

  doAdd(): void {
    this.slideInService.open(UserFormComponent, { wide: true });
  }

  onListFiltered(query: string): void {
    this.filterString = query.toLowerCase();
    this.createDataSource(this.users.filter((user) => {
      return user.username.toLowerCase().includes(this.filterString)
        || user.full_name.toLowerCase().includes(this.filterString)
        || user.uid.toString().includes(this.filterString);
    }));
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
