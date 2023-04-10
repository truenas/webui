import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ViewChild, ChangeDetectionStrategy,
  ViewChildren, QueryList,
  AfterViewInit,
  TemplateRef,
} from '@angular/core';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { select, Store } from '@ngrx/store';
import {
  combineLatest, Observable, of,
} from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { EmptyType } from 'app/enums/empty-type.enum';
import { User } from 'app/interfaces/user.interface';
import { IxDetailRowDirective } from 'app/modules/ix-tables/directives/ix-detail-row.directive';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
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
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;

  displayedColumns: string[] = ['username', 'uid', 'builtin', 'full_name', 'actions'];
  filterString = '';
  dataSource = new MatTableDataSource<User>([]);
  defaultSort: Sort = { active: 'uid', direction: 'asc' };

  expandedRow: User;
  @ViewChildren(IxDetailRowDirective) private detailRows: QueryList<IxDetailRowDirective>;

  readonly EmptyType = EmptyType;
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

  get emptyConfigService(): EmptyService {
    return this.emptyService;
  }

  constructor(
    private slideIn: IxSlideInService,
    private cdr: ChangeDetectorRef,
    private store$: Store<AppState>,
    private layoutService: LayoutService,
    private emptyService: EmptyService,
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
        this.cdr.markForCheck();
      },
      error: () => {
        this.createDataSource();
        this.cdr.markForCheck();
      },
    });
  }

  createDataSource(users: User[] = []): void {
    this.dataSource = new MatTableDataSource(users);
    setTimeout(() => {
      // TODO: Figure out how to avoid setTimeout to make it work on first loading
      if (this.filterString) {
        this.dataSource.filter = this.filterString;
      }
      this.dataSource.sort = this.sort;
      this.cdr.markForCheck();
    }, 0);
  }

  toggleBuiltins(): void {
    this.store$.dispatch(builtinUsersToggled());
  }

  doAdd(): void {
    const modal = this.slideIn.open(UserFormComponent, { wide: true });
    modal.setupForm();
  }

  onToggle(row: User): void {
    this.expandedRow = this.expandedRow === row ? null : row;
    this.toggleDetailRows();
    this.cdr.markForCheck();
  }

  toggleDetailRows(): void {
    this.detailRows.forEach((row) => {
      if (row.expanded && row.ixDetailRow !== this.expandedRow) {
        row.close();
      } else if (!row.expanded && row.ixDetailRow === this.expandedRow) {
        row.open();
      }
    });
  }

  onListFiltered(query: string): void {
    this.dataSource.filter = query;
  }

  handleDeletedUser(id: number): void {
    this.store$.dispatch(userRemoved({ id }));
  }
}
