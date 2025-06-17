import { isEmpty } from 'lodash-es';
import {
  Observable, filter, switchMap, take, map, of,
} from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { User } from 'app/interfaces/user.interface';
import { ApiDataProvider } from 'app/modules/ix-table/classes/api-data-provider/api-data-provider';
import { PaginationServerSide } from 'app/modules/ix-table/classes/api-data-provider/pagination-server-side.class';
import { SortingServerSide } from 'app/modules/ix-table/classes/api-data-provider/sorting-server-side.class';
import { TablePagination } from 'app/modules/ix-table/interfaces/table-pagination.interface';
import { TableSort } from 'app/modules/ix-table/interfaces/table-sort.interface';
import { ApiService } from 'app/modules/websocket/api.service';

export class UsersDataProvider extends ApiDataProvider<'user.query'> {
  private priorityUsername: string | null = null;
  private priorityUserLoaded = false;
  private originalPageSize: number;

  constructor(
    protected override api: ApiService,
    params: QueryParams<User> = [],
  ) {
    super(api, 'user.query', params);
    this.paginationStrategy = new PaginationServerSide();
    this.sortingStrategy = new SortingServerSide();
    this.originalPageSize = this.pagination.pageSize;
  }

  setPriorityUsername(username: string | null): void {
    this.priorityUsername = username;
    this.priorityUserLoaded = false;
  }

  override load(): void {
    this.emptyType$.next(EmptyType.Loading);
    this.subscription.add(
      this.countRows().pipe(
        switchMap((count: number) => {
          this.totalRows = count;

          if (!this.priorityUsername) {
            return this.loadRegularUsers();
          }

          return this.loadUsersWithPriority();
        }),
      ).subscribe({
        next: (users: User[]) => {
          this.handleUsersLoaded(users);
        },
        error: (error: unknown) => {
          console.error(this.method, error);
          this.totalRows = 0;
          this.currentPage$.next([]);
          this.emptyType$.next(EmptyType.Errors);
        },
      }),
    );
  }

  override setSorting(sorting: TableSort<User>): void {
    this.sorting = sorting;
    this.priorityUserLoaded = false;
    this.emptyType$.pipe(take(1), filter((value) => value !== EmptyType.Loading)).subscribe(() => {
      this.sortingStrategy.handleCurrentPage(this.load.bind(this));
    });
    this.sortingOrPaginationUpdate.emit();
  }

  override setPagination(pagination: TablePagination): void {
    this.pagination = pagination;
    this.priorityUserLoaded = false;

    this.emptyType$.pipe(take(1), filter((value) => value !== EmptyType.Loading)).subscribe(() => {
      this.paginationStrategy.handleCurrentPage(this.load.bind(this));
    });
    this.sortingOrPaginationUpdate.emit();
  }

  private loadRegularUsers(): Observable<User[]> {
    return this.api.call(this.method, this.prepareParams(this.params)) as Observable<User[]>;
  }

  private loadUsersWithPriority(): Observable<User[]> {
    const regularUsersParams = this.prepareRegularUsersParams();
    const regularUsers$ = this.api.call(this.method, regularUsersParams) as Observable<User[]>;

    return regularUsers$.pipe(
      switchMap((users: User[]) => {
        const priorityUserExists = users.some((user) => user.username === this.priorityUsername);

        if (priorityUserExists || this.priorityUserLoaded) {
          this.priorityUserLoaded = true;
          return of(users);
        }

        return this.loadPriorityUser().pipe(
          map((priorityUser: User | null) => {
            if (!priorityUser) {
              return users;
            }

            this.priorityUserLoaded = true;

            return this.mergeUsersWithPriority(users, priorityUser);
          }),
        );
      }),
    );
  }

  private loadPriorityUser(): Observable<User | null> {
    const priorityUserParams: QueryParams<User> = [
      [['username', '=', this.priorityUsername]],
      { limit: 1 },
    ];

    return (this.api.call(this.method, priorityUserParams) as Observable<User[]>).pipe(
      map((users: User[]) => (users.length > 0 ? users[0] : null)),
    );
  }

  private prepareRegularUsersParams(): QueryParams<User> {
    const baseParams = this.prepareParams(this.params) as QueryParams<User>;
    const [queryFilters, queryOptions] = baseParams;

    let adjustedOptions = { ...queryOptions };

    if (this.priorityUsername && !this.priorityUserLoaded && this.pagination.pageNumber === 1) {
      adjustedOptions = {
        ...adjustedOptions,
        limit: Math.max(1, (adjustedOptions.limit || this.originalPageSize) - 1),
      };
    }

    return [queryFilters, adjustedOptions];
  }

  private mergeUsersWithPriority(regularUsers: User[], priorityUser: User): User[] {
    const isFirstPage = this.pagination.pageNumber === 1;

    if (!isFirstPage) {
      return regularUsers;
    }

    const filteredUsers = regularUsers.filter((user) => user.username !== priorityUser.username);

    return [priorityUser, ...filteredUsers];
  }

  private handleUsersLoaded(users: User[]): void {
    this.currentPage$.next(users);
    const isSearchApplied = !isEmpty((this.params as QueryParams<User>)[0]);

    if (!users.length) {
      this.emptyType$.next(isSearchApplied ? EmptyType.NoSearchResults : EmptyType.NoPageData);
    } else {
      this.emptyType$.next(EmptyType.None);
    }
  }

  protected override countRows(): Observable<number> {
    const params = [
      (this.params as QueryParams<User>)[0] || [],
      { count: true },
    ] as QueryParams<User>;

    return (this.api.call(this.method, params) as unknown as Observable<number>).pipe(
      map((count: number) => {
        if (this.priorityUsername && !this.priorityUserLoaded) {
          return count;
        }
        return count;
      }),
    );
  }
}
