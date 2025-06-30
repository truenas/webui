import { isEmpty } from 'lodash-es';
import {
  map, Observable, of, switchMap,
} from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { ApiCallResponseType } from 'app/interfaces/api/api-call-directory.interface';
import { QueryFilters, QueryParams } from 'app/interfaces/query-api.interface';
import { User } from 'app/interfaces/user.interface';
import { ApiDataProvider } from 'app/modules/ix-table/classes/api-data-provider/api-data-provider';
import { ApiService } from 'app/modules/websocket/api.service';

export class UsersDataProvider extends ApiDataProvider<'user.query'> {
  private additionalUsername: string;

  constructor(
    api: ApiService,
    params: QueryParams<User>,
  ) {
    super(api, 'user.query', params);
  }

  shouldLoadUser(username: string): void {
    this.additionalUsername = username;
  }

  override load(): void {
    this.emptyType$.next(EmptyType.Loading);
    this.subscription.add(
      this.countRows().pipe(
        switchMap((count: number) => {
          this.totalRows = count;
          return this.api.call(this.method, this.prepareParams(this.params)) as Observable<ApiCallResponseType<'user.query'>[]>;
        }),
        switchMap((users) => {
          if (!this.additionalUsername || users.some((user) => user.username === this.additionalUsername)) {
            return of(users);
          }

          return this.api.call('user.query', [[['username', '=', this.additionalUsername]]]).pipe(
            map((additionalUsers) => [...additionalUsers, ...users]),
          );
        }),
      ).subscribe({
        next: (users: ApiCallResponseType<'user.query'>[]) => {
          this.rows = users;
          // this.expandedRow = users.find((user) => user.username === this.additionalUsername);
          this.additionalUsername = null;
          this.currentPage$.next(this.rows);
          const isSearchApplied = !isEmpty((this.params as QueryFilters<ApiCallResponseType<'user.query'>>)[0]);
          if (!users.length) {
            this.emptyType$.next(isSearchApplied ? EmptyType.NoSearchResults : EmptyType.NoPageData);
          } else {
            this.emptyType$.next(EmptyType.None);
          }
        },
        error: (error: unknown) => {
          console.error(this.method, error);
          this.totalRows = 0;
          this.rows = [];
          this.currentPage$.next([]);
          this.emptyType$.next(EmptyType.Errors);
        },
      }),
    );
  }
}
