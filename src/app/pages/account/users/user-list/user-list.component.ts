import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ViewChild,
  ChangeDetectionStrategy,
  AfterViewInit,
  TemplateRef,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { select, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { combineLatest, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { EmptyType } from 'app/enums/empty-type.enum';
import { User } from 'app/interfaces/user.interface';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';
import { TableColumn } from 'app/modules/ix-table2/interfaces/table-column.interface';
import { userPageEntered, userRemoved } from 'app/pages/account/users/store/user.actions';
import { selectUsers, selectUserState, selectUsersTotal } from 'app/pages/account/users/store/user.selectors';
import { UserFormComponent } from 'app/pages/account/users/user-form/user-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { LayoutService } from 'app/services/layout.service';
import { AppState } from 'app/store';
import { builtinUsersToggled } from 'app/store/preferences/preferences.actions';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';

@UntilDestroy()
@Component({
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListComponent implements OnInit, AfterViewInit {
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;

  dataProvider = new ArrayDataProvider<User>();
  columns: TableColumn<User>[] = [
    {
      title: this.translate.instant('Username'),
      propertyName: 'username',
      sortable: true,
    },
    {
      title: this.translate.instant('UID'),
      propertyName: 'uid',
      sortable: true,
    },
    {
      title: this.translate.instant('Builtin'),
      propertyName: 'builtin',
      sortable: true,
    },
    {
      title: this.translate.instant('Full Name'),
      propertyName: 'full_name',
      sortable: true,
    },
  ];

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
  constructor(
    private slideInService: IxSlideInService,
    private cdr: ChangeDetectorRef,
    private store$: Store<AppState>,
    private layoutService: LayoutService,
    private translate: TranslateService,
  ) { }

  ngOnInit(): void {
    this.store$.dispatch(userPageEntered());
    this.getPreferences();
    this.getUsers();
  }

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
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
        this.createDataSource(users);
      },
      error: () => {
        this.createDataSource();
      },
    });
  }

  createDataSource(users: User[] = []): void {
    this.dataProvider.setRows(of(users));
    this.cdr.markForCheck();
  }

  toggleBuiltins(): void {
    this.store$.dispatch(builtinUsersToggled());
  }

  doAdd(): void {
    this.slideInService.open(UserFormComponent, { wide: true });
  }

  onListFiltered(query: string): void {
    this.filterString = query;
  }

  handleDeletedUser(id: number): void {
    this.store$.dispatch(userRemoved({ id }));
  }
}
