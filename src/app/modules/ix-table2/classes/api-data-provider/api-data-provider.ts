import { Observable, switchMap } from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { ApiCallDirectory, ApiCallMethod } from 'app/interfaces/api/api-call-directory.interface';
import { QueryFilters } from 'app/interfaces/query-api.interface';
import { WebSocketError } from 'app/interfaces/websocket-error.interface';
import { PaginationServerSide } from 'app/modules/ix-table2/classes/api-data-provider/pagination-server-side.class';
import { SortingServerSide } from 'app/modules/ix-table2/classes/api-data-provider/sorting-server-side.class';
import { BaseDataProvider } from 'app/modules/ix-table2/classes/base-data-provider';
import { TablePagination } from 'app/modules/ix-table2/interfaces/table-pagination.interface';
import { TableSort } from 'app/modules/ix-table2/interfaces/table-sort.interface';
import { WebSocketService } from 'app/services/ws.service';

// TODO: Extract to separate files
// TODO: Replace with QueryParams?
export type ApiCallParamsRecord = Record<string, unknown>;

// TODO: Narrow down the type of M to only include .query methods
// TODO: T can be inferred from M
export class ApiDataProvider<T, M extends ApiCallMethod> extends BaseDataProvider<T> {
  paginationStrategy: PaginationServerSide;
  sortingStrategy: SortingServerSide;

  private rows: T[] = [];

  constructor(
    private ws: WebSocketService,
    private method: M,
    private params: ApiCallDirectory[M]['params'] = [],
  ) {
    super();
    this.paginationStrategy = new PaginationServerSide();
    this.sortingStrategy = new SortingServerSide();
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
      ).subscribe({
        next: (rows: T[]) => {
          this.rows = rows;
          this.currentPage$.next(this.rows);
          this.emptyType$.next(rows.length ? EmptyType.NoSearchResults : EmptyType.NoPageData);
        },
        error: (error: WebSocketError) => {
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
    this.sortingStrategy.handleCurrentPage(this.load.bind(this));
    this.controlsStateUpdated.emit();
  }

  setPagination(pagination: TablePagination): void {
    this.pagination = pagination;
    this.paginationStrategy.handleCurrentPage(this.load.bind(this));
    this.controlsStateUpdated.emit();
  }

  private countRows(): Observable<number> {
    let params = [(this.params as unknown as QueryFilters<T>)[0] || [], { count: true }] as unknown;

    if (this.method === 'audit.query') {
      params = [
        {
          'query-filters': (this.params as unknown as QueryFilters<T>)[0] || [],
          'query-options': { count: true },
        },
      ];
    }

    return this.ws.call(this.method, params as ApiCallDirectory[M]['params']) as Observable<number>;
  }

  private prepareParams(params: ApiCallDirectory[M]['params']): ApiCallDirectory[M]['params'] {
    // TODO: Current merge is not entirely correct. Introduce a separate function.
    // TODO: Clarify whether we should use positional arguments or 'query-filters'

    const queryFilters = (params as unknown as QueryFilters<T>)[0] || [];
    const queryOptions = {
      ...this.paginationStrategy.getParams(this.pagination, this.totalRows),
      ...this.sortingStrategy.getParams(this.sorting),
    };

    if (this.method === 'audit.query') {
      return [
        {
          'query-filters': queryFilters,
          'query-options': queryOptions,
        },
      ] as ApiCallDirectory[M]['params'];
    }

    return [queryFilters, queryOptions] as ApiCallDirectory[M]['params'];
  }
}
