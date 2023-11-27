import { map, Observable, switchMap } from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { ApiCallDirectory, ApiCallMethod } from 'app/interfaces/api/api-call-directory.interface';
import { QueryFilters } from 'app/interfaces/query-api.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { PaginationClientSide } from 'app/modules/ix-table2/classes/api-data-provider/pagination-client-side';
import { SortingClientSide } from 'app/modules/ix-table2/classes/api-data-provider/sorting-client-side.class';
import { BaseDataProvider } from 'app/modules/ix-table2/classes/base-data-provider';
import { PaginationStrategy, TablePagination } from 'app/modules/ix-table2/interfaces/table-pagination.interface';
import { SortingStrategy, TableSort } from 'app/modules/ix-table2/interfaces/table-sort.interface';
import { WebSocketService } from 'app/services/ws.service';

// TODO: Extract to separate files
// TODO: Replace with QueryParams?
export interface ApiCallParams { [key: string]: unknown }

// TODO: Narrow down the type of M to only include .query methods
// TODO: T can be inferred from M
export class ApiDataProvider<T, M extends ApiCallMethod> extends BaseDataProvider<T> {
  paginationStrategy: PaginationStrategy;
  sortingStrategy: SortingStrategy;

  private rows: T[] = [];

  constructor(
    private ws: WebSocketService,
    private method: M,
    private params: ApiCallDirectory[M]['params'] = [],
  ) {
    super();
    this.paginationStrategy = new PaginationClientSide();
    this.sortingStrategy = new SortingClientSide();
  }

  setParams(params: ApiCallDirectory[M]['params']): void {
    this.params = params;
  }

  load(): void {
    this.emptyType$.next(EmptyType.Loading);
    this.subscription.add(
      this.countRows().pipe(
        switchMap((count: number) => {
          this.totalRows = count;
          return this.ws.call(this.method, this.prepareParams(this.params));
        }),
        map((rows: T[]) => {
          return this.paginationStrategy.paginate<T>(
            this.sortingStrategy.sort<T>(rows, this.sorting),
            this.pagination,
          );
        }),
      ).subscribe({
        next: (rows) => {
          this.rows = rows;
          this.currentPage$.next(this.rows);
          this.emptyType$.next(rows.length ? EmptyType.NoSearchResults : EmptyType.NoPageData);
        },
        error: (error: WebsocketError) => {
          console.error(this.method, error);
          this.totalRows = 0;
          this.rows = [];
          this.currentPage$.next([]);
          this.emptyType$.next(EmptyType.Errors);
        },
      }),
    );
  }

  setSorting(sorting: TableSort<T>): void {
    this.sorting = sorting;
    this.sortingStrategy.handleCurrentPage(
      () => this.load(),
      () => this.updateCurrentPage(this.rows),
    );
    this.controlsStateUpdated.emit();
  }

  setPagination(pagination: TablePagination): void {
    this.pagination = pagination;
    this.paginationStrategy.handleCurrentPage(
      () => this.load(),
      () => this.updateCurrentPage(this.rows),
    );
    this.controlsStateUpdated.emit();
  }

  private countRows(): Observable<number> {
    // TODO: ApiDataProvider only currently works for audit.query that has non-standard parameters
    const params = [
      {
        'query-filters': (this.params as unknown as QueryFilters<T>)[0] || [],
        'query-options': { count: true },
      },
    ];

    return this.ws.call(this.method, params as ApiCallDirectory[M]['params']) as Observable<number>;
  }

  private prepareParams(params: ApiCallDirectory[M]['params']): ApiCallDirectory[M]['params'] {
    // TODO: Current merge is not entirely correct. Introduce a separate function.
    // TODO: Clarify whether we should use positional arguments or 'query-filters'
    return [
      {
        'query-filters': (params as unknown as QueryFilters<T>)[0] || [],
        'query-options': {
          ...this.paginationStrategy.getParams(this.pagination),
          ...this.sortingStrategy.getParams(this.sorting),
        },
      },
    ] as unknown as ApiCallDirectory[M]['params'];
  }
}
