import {
  Observable, filter, switchMap, take,
} from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { ApiCallParams, ApiCallResponseType, QueryMethods } from 'app/interfaces/api/api-call-directory.interface';
import { QueryFilters } from 'app/interfaces/query-api.interface';
import { PaginationServerSide } from 'app/modules/ix-table/classes/api-data-provider/pagination-server-side.class';
import { SortingServerSide } from 'app/modules/ix-table/classes/api-data-provider/sorting-server-side.class';
import { BaseDataProvider } from 'app/modules/ix-table/classes/base-data-provider';
import { TablePagination } from 'app/modules/ix-table/interfaces/table-pagination.interface';
import { TableSort } from 'app/modules/ix-table/interfaces/table-sort.interface';
import { ApiService } from 'app/services/websocket/api.service';

export class ApiDataProvider<T extends QueryMethods> extends BaseDataProvider<ApiCallResponseType<T>> {
  paginationStrategy: PaginationServerSide;
  sortingStrategy: SortingServerSide;

  private rows: ApiCallResponseType<T>[] = [];

  constructor(
    protected api: ApiService,
    protected method: T,
    protected params: ApiCallParams<T> = [],
  ) {
    super();
    this.paginationStrategy = new PaginationServerSide();
    this.sortingStrategy = new SortingServerSide();
  }

  setParams(params: ApiCallParams<T>): void {
    this.params = params;
  }

  load(): void {
    this.emptyType$.next(EmptyType.Loading);
    this.subscription.add(
      this.countRows().pipe(
        switchMap((count: number) => {
          this.totalRows = count;
          return this.api.call(this.method, this.prepareParams(this.params)) as Observable<ApiCallResponseType<T>[]>;
        }),
      ).subscribe({
        next: (rows: ApiCallResponseType<T>[]) => {
          this.rows = rows;
          this.currentPage$.next(this.rows);
          this.emptyType$.next(rows.length ? EmptyType.NoSearchResults : EmptyType.NoPageData);
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

  override setSorting(sorting: TableSort<ApiCallResponseType<T>>): void {
    this.sorting = sorting;
    this.emptyType$.pipe(take(1), filter((value) => value !== EmptyType.Loading)).subscribe(() => {
      this.sortingStrategy.handleCurrentPage(this.load.bind(this));
    });
    this.controlsStateUpdated.emit();
  }

  override setPagination(pagination: TablePagination): void {
    this.pagination = pagination;

    this.emptyType$.pipe(take(1), filter((value) => value !== EmptyType.Loading)).subscribe(() => {
      this.paginationStrategy.handleCurrentPage(this.load.bind(this));
    });
    this.controlsStateUpdated.emit();
  }

  protected countRows(): Observable<number> {
    const params = [
      (this.params as QueryFilters<ApiCallResponseType<T>>)[0] || [],
      { count: true },
    ] as ApiCallParams<T>;

    return this.api.call(this.method, params) as unknown as Observable<number>;
  }

  protected prepareParams(params: ApiCallParams<T>): ApiCallParams<T> {
    // TODO: Current merge is not entirely correct. Introduce a separate function.

    const queryFilters = (params as QueryFilters<ApiCallResponseType<T>>)[0] || [];
    const queryOptions = {
      ...this.paginationStrategy.getParams(this.pagination, this.totalRows),
      ...this.sortingStrategy.getParams(this.sorting),
    };

    return [queryFilters, queryOptions] as ApiCallParams<T>;
  }
}
